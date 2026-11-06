import { Platform } from 'react-native';

// Utilitários de conversão Base64 e Uint8Array sem dependência de Buffer/Node
function uint8ArrayToBase64(uint8) {
  let binary = '';
  const len = uint8.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = uint8.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < binary.length) {
    const chr1 = binary.charCodeAt(i++);
    const chr2 = binary.charCodeAt(i++);
    const chr3 = binary.charCodeAt(i++);
    const enc1 = chr1 >> 2;
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
    let enc4 = chr3 & 63;
    if (isNaN(chr2)) {
      enc3 = enc4 = 64;
    } else if (isNaN(chr3)) {
      enc4 = 64;
    }
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

function base64ToUint8Array(base64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const cleanBase64 = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = cleanBase64.length;
  const bufferLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const encoded1 = chars.indexOf(cleanBase64[i]);
    const encoded2 = chars.indexOf(cleanBase64[i + 1]);
    const encoded3 = chars.indexOf(cleanBase64[i + 2]);
    const encoded4 = chars.indexOf(cleanBase64[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (encoded3 !== -1 && encoded3 !== 64) {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (encoded4 !== -1 && encoded4 !== 64) {
      bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
    }
  }
  return bytes.subarray(0, p);
}

function lerBytesViaXHR(uri, maxBytes = 1572864) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        const blob = xhr.response;
        if (!blob) {
          reject(new Error('Blob vazio'));
          return;
        }
        const fatia = blob.slice ? blob.slice(0, maxBytes) : blob;
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const resultado = reader.result || '';
            const base64Data = resultado.includes(',') ? resultado.split(',')[1] : resultado;
            resolve({
              bytes: base64ToUint8Array(base64Data),
              totalSize: blob.size || 0,
            });
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(fatia);
      };
      xhr.onerror = () => reject(new Error('Falha no XHR'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    } catch (err) {
      reject(err);
    }
  });
}

function decodificarTextoID3(bytes) {
  if (!bytes || bytes.length <= 1) return '';
  const encoding = bytes[0];
  const payload = bytes.subarray(1);

  try {
    if (encoding === 0) {
      // ISO-8859-1
      let str = '';
      for (let i = 0; i < payload.length; i++) {
        if (payload[i] === 0) break;
        str += String.fromCharCode(payload[i]);
      }
      return str.trim();
    } else if (encoding === 3) {
      // UTF-8
      if (typeof TextDecoder !== 'undefined') {
        const dec = new TextDecoder('utf-8');
        return dec.decode(payload).replace(/\0.*$/, '').trim();
      }
      let str = '';
      for (let i = 0; i < payload.length; i++) {
        if (payload[i] === 0) break;
        str += String.fromCharCode(payload[i]);
      }
      return decodeURIComponent(escape(str)).trim();
    } else if (encoding === 1 || encoding === 2) {
      // UTF-16 with BOM (1) ou UTF-16BE (2)
      let inicio = 0;
      let littleEndian = true;
      if (payload[0] === 0xfe && payload[1] === 0xff) {
        littleEndian = false;
        inicio = 2;
      } else if (payload[0] === 0xff && payload[1] === 0xfe) {
        littleEndian = true;
        inicio = 2;
      } else if (encoding === 2) {
        littleEndian = false;
      }
      let resultado = '';
      for (let i = inicio; i < payload.length - 1; i += 2) {
        const code = littleEndian
          ? payload[i] | (payload[i + 1] << 8)
          : (payload[i] << 8) | payload[i + 1];
        if (code === 0) break;
        resultado += String.fromCharCode(code);
      }
      return resultado.trim();
    }
  } catch (e) {}
  return '';
}

function extrairID3Binario(uint8Array) {
  const resultado = { title: '', artist: '', album: '', pictureBase64: null, mime: 'image/jpeg' };
  try {
    if (
      !uint8Array ||
      uint8Array.length < 10 ||
      uint8Array[0] !== 0x49 ||
      uint8Array[1] !== 0x44 ||
      uint8Array[2] !== 0x33
    ) {
      return resultado;
    }

    const versao = uint8Array[3];
    const tamanhoTag =
      ((uint8Array[6] & 0x7f) << 21) |
      ((uint8Array[7] & 0x7f) << 14) |
      ((uint8Array[8] & 0x7f) << 7) |
      (uint8Array[9] & 0x7f);

    const limite = Math.min(uint8Array.length, 10 + tamanhoTag);
    let offset = 10;

    // Suporte ID3v2.2 (tags de 3 caracteres e tamanhos de 3 bytes)
    if (versao === 2) {
      while (offset + 6 < limite) {
        const frameId = String.fromCharCode(
          uint8Array[offset],
          uint8Array[offset + 1],
          uint8Array[offset + 2]
        );
        if (!/^[A-Z0-9]{3}$/.test(frameId)) break;
        const frameSize =
          (uint8Array[offset + 3] << 16) |
          (uint8Array[offset + 4] << 8) |
          uint8Array[offset + 5];

        if (frameSize <= 0 || offset + 6 + frameSize > uint8Array.length) break;
        const dadosFrame = uint8Array.subarray(offset + 6, offset + 6 + frameSize);

        if (frameId === 'TT2' && !resultado.title) {
          resultado.title = decodificarTextoID3(dadosFrame);
        } else if (frameId === 'TP1' && !resultado.artist) {
          resultado.artist = decodificarTextoID3(dadosFrame);
        } else if (frameId === 'TAL' && !resultado.album) {
          resultado.album = decodificarTextoID3(dadosFrame);
        } else if (frameId === 'PIC' && !resultado.pictureBase64) {
          if (dadosFrame.length > 5) {
            const format = String.fromCharCode(dadosFrame[1], dadosFrame[2], dadosFrame[3]).toLowerCase();
            resultado.mime = format === 'png' ? 'image/png' : 'image/jpeg';
            resultado.pictureBase64 = uint8ArrayToBase64(dadosFrame.subarray(5));
          }
        }
        offset += 6 + frameSize;
      }
      return resultado;
    }

    // Suporte ID3v2.3 e ID3v2.4 (tags de 4 caracteres)
    while (offset + 10 < limite) {
      const frameId = String.fromCharCode(
        uint8Array[offset],
        uint8Array[offset + 1],
        uint8Array[offset + 2],
        uint8Array[offset + 3]
      );

      if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

      let frameSize = 0;
      if (versao === 4) {
        frameSize =
          ((uint8Array[offset + 4] & 0x7f) << 21) |
          ((uint8Array[offset + 5] & 0x7f) << 14) |
          ((uint8Array[offset + 6] & 0x7f) << 7) |
          (uint8Array[offset + 7] & 0x7f);
      } else {
        frameSize =
          (uint8Array[offset + 4] << 24) |
          (uint8Array[offset + 5] << 16) |
          (uint8Array[offset + 6] << 8) |
          uint8Array[offset + 7];
      }

      if (frameSize <= 0 || offset + 10 + frameSize > uint8Array.length) break;

      const dadosFrame = uint8Array.subarray(offset + 10, offset + 10 + frameSize);

      if (frameId === 'TIT2' && !resultado.title) {
        resultado.title = decodificarTextoID3(dadosFrame);
      } else if (frameId === 'TPE1' && !resultado.artist) {
        resultado.artist = decodificarTextoID3(dadosFrame);
      } else if (frameId === 'TALB' && !resultado.album) {
        resultado.album = decodificarTextoID3(dadosFrame);
      } else if (frameId === 'APIC' && !resultado.pictureBase64) {
        const textEncoding = dadosFrame[0];
        let pos = 1;
        let mime = '';
        while (pos < dadosFrame.length && dadosFrame[pos] !== 0) {
          mime += String.fromCharCode(dadosFrame[pos]);
          pos++;
        }
        pos++;
        pos++;

        if (textEncoding === 1 || textEncoding === 2) {
          while (pos < dadosFrame.length - 1 && !(dadosFrame[pos] === 0 && dadosFrame[pos + 1] === 0)) {
            pos += 2;
          }
          pos += 2;
        } else {
          while (pos < dadosFrame.length && dadosFrame[pos] !== 0) {
            pos++;
          }
          pos++;
        }

        if (pos < dadosFrame.length) {
          const imgBytes = dadosFrame.subarray(pos);
          resultado.pictureBase64 = uint8ArrayToBase64(imgBytes);
          resultado.mime = mime || 'image/jpeg';
        }
      }

      offset += 10 + frameSize;
    }
  } catch (e) {}
  return resultado;
}

export async function extrairTags(uri, nomeArquivoPadrao = 'Música Desconhecida') {
  const nomeLimpo = nomeArquivoPadrao.replace(/\.[^/.]+$/, '');
  let tamanhoArquivo = 0;
  let uint8Array = null;

  try {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      uint8Array = new Uint8Array(arrayBuffer);
      tamanhoArquivo = uint8Array.length;
    } else {
      try {
        const resXHR = await lerBytesViaXHR(uri, 1572864);
        uint8Array = resXHR.bytes;
        tamanhoArquivo = resXHR.totalSize;
      } catch (e1) {}

      if (!uint8Array) {
        try {
          const response = await fetch(uri);
          const arrayBuffer = await response.arrayBuffer();
          uint8Array = new Uint8Array(arrayBuffer);
          tamanhoArquivo = uint8Array.length;
        } catch (eFetch) {}
      }

      if (!uint8Array) {
        try {
          const FileSystem = require('expo-file-system');
          if (FileSystem?.readAsStringAsync) {
            const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            uint8Array = base64ToUint8Array(base64Data);
            tamanhoArquivo = uint8Array.length;
          }
        } catch (e3) {}
      }
    }

    if (!uint8Array) {
      return {
        title: nomeLimpo,
        artist: 'Artista Desconhecido',
        album: 'Sem Álbum',
        artwork: null,
        duration: 0,
      };
    }

    const id3 = extrairID3Binario(uint8Array);
    const titulo = id3.title || nomeLimpo;
    const artista = id3.artist || 'Artista Desconhecido';
    const album = id3.album || 'Sem Álbum';
    const capaUri = id3.pictureBase64 ? `data:${id3.mime};base64,${id3.pictureBase64}` : null;
    let duracao = 0;

    if (tamanhoArquivo > 0) {
      duracao = Math.round((tamanhoArquivo * 8) / 320000);
    }

    return {
      title: titulo,
      artist: artista,
      album: album,
      artwork: capaUri,
      duration: duracao || 0,
    };
  } catch (error) {
    return {
      title: nomeLimpo,
      artist: 'Artista Desconhecido',
      album: 'Sem Álbum',
      artwork: null,
      duration: 0,
    };
  }
}
