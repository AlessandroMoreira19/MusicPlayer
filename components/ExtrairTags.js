import { File } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import { parseBuffer } from 'music-metadata/lib/core';

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
              bytes: Buffer.from(base64Data, 'base64'),
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
  const payload = bytes.slice(1);

  try {
    if (encoding === 0 || encoding === 3) {
      return Buffer.from(payload).toString('utf8').replace(/\0/g, '').trim();
    } else if (encoding === 1 || encoding === 2) {
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
        if (code !== 0) resultado += String.fromCharCode(code);
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

      const dadosFrame = uint8Array.slice(offset + 10, offset + 10 + frameSize);

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
          const imgBytes = dadosFrame.slice(pos);
          resultado.pictureBase64 = Buffer.from(imgBytes).toString('base64');
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
          const arquivo = new File(uri);
          if (arquivo.exists) {
            tamanhoArquivo = arquivo.size || 0;
            const rawBytes = await arquivo.bytes();
            uint8Array = new Uint8Array(
              rawBytes.buffer,
              rawBytes.byteOffset,
              Math.min(rawBytes.byteLength, 1572864)
            );
          }
        } catch (e2) {}
      }

      if (!uint8Array) {
        try {
          const base64Data = await LegacyFileSystem.readAsStringAsync(uri, { encoding: 'base64' });
          uint8Array = Buffer.from(base64Data, 'base64');
          tamanhoArquivo = uint8Array.length;
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

    let titulo = '';
    let artista = '';
    let album = '';
    let duracao = 0;
    let base64Pic = null;
    let mimeType = 'image/jpeg';

    try {
      const metadata = await parseBuffer(uint8Array, 'audio/mpeg', {
        duration: true,
        skipPostHeaders: true,
      });
      titulo = metadata.common?.title || '';
      artista = metadata.common?.artist || '';
      album = metadata.common?.album || '';
      duracao = metadata.format?.duration || 0;

      if (metadata.common?.picture?.length > 0) {
        const pic = metadata.common.picture[0];
        base64Pic = Buffer.from(pic.data).toString('base64');
        mimeType = pic.format || 'image/jpeg';
      }
    } catch (errMM) {}

    if (!titulo || !artista || !album || !base64Pic) {
      const id3 = extrairID3Binario(uint8Array);
      if (!titulo && id3.title) titulo = id3.title;
      if (!artista && id3.artist) artista = id3.artist;
      if (!album && id3.album) album = id3.album;
      if (!base64Pic && id3.pictureBase64) {
        base64Pic = id3.pictureBase64;
        mimeType = id3.mime;
      }
    }

    if (!duracao && tamanhoArquivo > 0) {
      duracao = Math.round((tamanhoArquivo * 8) / 320000);
    }

    const capaUri = base64Pic ? `data:${mimeType};base64,${base64Pic}` : null;

    return {
      title: titulo || nomeLimpo,
      artist: artista || 'Artista Desconhecido',
      album: album || 'Sem Álbum',
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