import { Platform } from 'react-native';

const TABELA_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

// Converte bytes binários para Base64 sem depender de Buffer do Node.js
function uint8ArrayToBase64(uint8) {
  let binario = '';
  for (let i = 0; i < uint8.byteLength; i += 8192) {
    binario += String.fromCharCode.apply(null, uint8.subarray(i, Math.min(i + 8192, uint8.byteLength)));
  }
  if (typeof btoa === 'function') return btoa(binario);

  let saida = '';
  for (let i = 0; i < binario.length; ) {
    const c1 = binario.charCodeAt(i++);
    const c2 = binario.charCodeAt(i++);
    const c3 = binario.charCodeAt(i++);
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >> 4);
    let e3 = ((c2 & 15) << 2) | (c3 >> 6);
    let e4 = c3 & 63;
    if (isNaN(c2)) e3 = e4 = 64;
    else if (isNaN(c3)) e4 = 64;
    saida += TABELA_B64[e1] + TABELA_B64[e2] + TABELA_B64[e3] + TABELA_B64[e4];
  }
  return saida;
}

function base64ToUint8Array(base64) {
  const limpo = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((limpo.length * 3) / 4));
  let p = 0;

  for (let i = 0; i < limpo.length; i += 4) {
    const e1 = TABELA_B64.indexOf(limpo[i]);
    const e2 = TABELA_B64.indexOf(limpo[i + 1]);
    const e3 = TABELA_B64.indexOf(limpo[i + 2]);
    const e4 = TABELA_B64.indexOf(limpo[i + 3]);

    bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (e3 !== -1 && e3 !== 64) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (e4 !== -1 && e4 !== 64) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes.subarray(0, p);
}

// Lê apenas o início do MP3 (1,5 MB) onde ficam as tags e a capa, economizando memória
function lerBytesViaXHR(uri, maxBytes = 1572864) {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        const blob = xhr.response;
        if (!blob) return reject(new Error('Blob vazio'));
        const fatia = blob.slice ? blob.slice(0, maxBytes) : blob;
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const res = reader.result || '';
            const b64 = res.includes(',') ? res.split(',')[1] : res;
            resolve({ bytes: base64ToUint8Array(b64), totalSize: blob.size || 0 });
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

// Decodifica textos ID3 conforme o 1º byte: 0 = ISO-8859-1, 1/2 = UTF-16, 3 = UTF-8
function decodificarTextoID3(bytes) {
  if (!bytes || bytes.length <= 1) return '';
  const encoding = bytes[0];
  const payload = bytes.subarray(1);

  try {
    if (encoding === 1 || encoding === 2) {
      let inicio = 0;
      let littleEndian = encoding !== 2;
      if (payload[0] === 0xfe && payload[1] === 0xff) {
        littleEndian = false;
        inicio = 2;
      } else if (payload[0] === 0xff && payload[1] === 0xfe) {
        littleEndian = true;
        inicio = 2;
      }
      let txt = '';
      for (let i = inicio; i < payload.length - 1; i += 2) {
        const code = littleEndian ? payload[i] | (payload[i + 1] << 8) : (payload[i] << 8) | payload[i + 1];
        if (code === 0) break;
        txt += String.fromCharCode(code);
      }
      return txt.trim();
    }

    if (encoding === 3 && typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8').decode(payload).replace(/\0.*$/, '').trim();
    }

    let str = '';
    for (let i = 0; i < payload.length && payload[i] !== 0; i++) {
      str += String.fromCharCode(payload[i]);
    }
    return (encoding === 3 ? decodeURIComponent(escape(str)) : str).trim();
  } catch (e) {
    return '';
  }
}

// Inteiro "syncsafe" do padrão ID3: usa apenas 7 bits úteis por byte
const lerSyncSafe = (b, o) => ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);

// Percorre os frames binários ID3v2.2, v2.3 e v2.4 em busca de título, artista, álbum e capa
function extrairID3Binario(bytes) {
  const res = { title: '', artist: '', album: '', pictureBase64: null, mime: 'image/jpeg' };
  try {
    // Verifica assinatura "ID3" (0x49, 0x44, 0x33) nos 3 primeiros bytes
    if (!bytes || bytes.length < 10 || bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
      return res;
    }

    const versao = bytes[3];
    const v22 = versao === 2;
    const tamHeaderFrame = v22 ? 6 : 10;
    const limite = Math.min(bytes.length, 10 + lerSyncSafe(bytes, 6));
    let offset = 10;

    while (offset + tamHeaderFrame < limite) {
      const frameId = v22
        ? String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2])
        : String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);

      if (!(v22 ? /^[A-Z0-9]{3}$/ : /^[A-Z0-9]{4}$/).test(frameId)) break;

      const frameSize = v22
        ? (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5]
        : versao === 4
          ? lerSyncSafe(bytes, offset + 4)
          : ((bytes[offset + 4] << 24) >>> 0) + ((bytes[offset + 5] << 16) | (bytes[offset + 6] << 8) | bytes[offset + 7]);

      if (frameSize <= 0 || offset + tamHeaderFrame + frameSize > bytes.length) break;
      const dados = bytes.subarray(offset + tamHeaderFrame, offset + tamHeaderFrame + frameSize);

      if ((frameId === 'TIT2' || frameId === 'TT2') && !res.title) {
        res.title = decodificarTextoID3(dados);
      } else if ((frameId === 'TPE1' || frameId === 'TP1') && !res.artist) {
        res.artist = decodificarTextoID3(dados);
      } else if ((frameId === 'TALB' || frameId === 'TAL') && !res.album) {
        res.album = decodificarTextoID3(dados);
      } else if (frameId === 'PIC' && !res.pictureBase64 && dados.length > 5) {
        const fmt = String.fromCharCode(dados[1], dados[2], dados[3]).toLowerCase();
        res.mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
        let pos = 5;
        while (pos < dados.length && dados[pos] !== 0) pos++;
        if (pos + 1 < dados.length) res.pictureBase64 = uint8ArrayToBase64(dados.subarray(pos + 1));
      } else if (frameId === 'APIC' && !res.pictureBase64) {
        // Pula cabeçalho do APIC (encoding + MIME + tipo + descrição) até chegar nos bytes da imagem
        const enc = dados[0];
        let pos = 1;
        let mime = '';
        while (pos < dados.length && dados[pos] !== 0) mime += String.fromCharCode(dados[pos++]);
        pos += 2; // Pula o byte nulo do MIME e o byte de tipo da imagem
        if (enc === 1 || enc === 2) {
          while (pos < dados.length - 1 && !(dados[pos] === 0 && dados[pos + 1] === 0)) pos += 2;
          pos += 2;
        } else {
          while (pos < dados.length && dados[pos] !== 0) pos++;
          pos++;
        }
        if (pos < dados.length) {
          res.pictureBase64 = uint8ArrayToBase64(dados.subarray(pos));
          res.mime = mime || 'image/jpeg';
        }
      }

      if (res.title && res.artist && res.album && res.pictureBase64) break;
      offset += tamHeaderFrame + frameSize;
    }
  } catch (e) {}
  return res;
}

async function carregarBytesAudio(uri) {
  if (Platform.OS !== 'web') {
    try {
      return await lerBytesViaXHR(uri);
    } catch (e) {}
  }

  try {
    const resp = await fetch(uri);
    const bytes = new Uint8Array(await resp.arrayBuffer());
    return { bytes, totalSize: bytes.length };
  } catch (e) {}

  if (Platform.OS !== 'web') {
    try {
      const FileSystem = require('expo-file-system');
      if (FileSystem?.readAsStringAsync) {
        const b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        const bytes = base64ToUint8Array(b64);
        return { bytes, totalSize: bytes.length };
      }
    } catch (e) {}
  }
  return null;
}

export async function extrairTags(uri, nomeArquivoPadrao = 'Música Desconhecida') {
  const nomeLimpo = nomeArquivoPadrao.replace(/\.[^/.]+$/, '');
  const padrao = { title: nomeLimpo, artist: 'Artista Desconhecido', album: 'Sem Álbum', artwork: null, duration: 0 };

  try {
    const arquivo = await carregarBytesAudio(uri);
    if (!arquivo?.bytes) return padrao;

    const id3 = extrairID3Binario(arquivo.bytes);
    return {
      title: id3.title || nomeLimpo,
      artist: id3.artist || 'Artista Desconhecido',
      album: id3.album || 'Sem Álbum',
      artwork: id3.pictureBase64 ? `data:${id3.mime};base64,${id3.pictureBase64}` : null,
      // Estima duração inicial em 320 kbps até o player carregar a duração exata
      duration: arquivo.totalSize > 0 ? Math.round((arquivo.totalSize * 8) / 320000) : 0,
    };
  } catch (e) {
    return padrao;
  }
}
