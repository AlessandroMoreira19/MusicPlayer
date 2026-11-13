import { Platform } from 'react-native';

// O React Native e o Expo não possuem um leitor nativo de metadados MP3 (ID3).
// Por isso, este arquivo lê os primeiros bytes do MP3 para extrair Título, Artista, Álbum e Capa.
// Documentação oficial do padrão ID3v2: https://id3.org/id3v2.3.0

const TABELA_B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

// Converte os bytes da imagem da capa (Uint8Array) para texto Base64 (aceito pelo <Image> do React Native)
// Referência btoa: https://www.w3schools.com/jsref/met_win_btoa.asp
// Referência Uint8Array: https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array
function uint8ArrayToBase64(uint8) {
  let binario = '';
  for (let i = 0; i < uint8.byteLength; i += 8192) {
    binario += String.fromCharCode.apply(null, uint8.subarray(i, Math.min(i + 8192, uint8.byteLength)));
  }
  if (typeof btoa === 'function') return btoa(binario);

  // Fallback com operadores bit a bit (bitwise) caso o ambiente nativo não tenha btoa global
  // Referência Bitwise: https://www.w3schools.com/js/js_bitwise.asp
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

// Converte uma string Base64 de volta para um vetor de bytes (Uint8Array)
// Referência Bitwise: https://www.w3schools.com/js/js_bitwise.asp
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

// Lê apenas o início do MP3 (1,5 MB) onde ficam as tags e a capa, economizando memória no celular
// Referência XMLHttpRequest: https://www.w3schools.com/xml/xml_http.asp
// Referência FileReader: https://developer.mozilla.org/pt-BR/docs/Web/API/FileReader
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

// Decodifica os textos salvos dentro do MP3 conforme o byte de codificação: 0 = ISO-8859-1, 1/2 = UTF-16, 3 = UTF-8
// Referência String.fromCharCode: https://www.w3schools.com/jsref/jsref_fromcharcode.asp
// Referência TextDecoder: https://developer.mozilla.org/pt-BR/docs/Web/API/TextDecoder
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

// No padrão ID3, o tamanho do cabeçalho usa "SyncSafe Integer" (7 bits por byte, ignorando o 8º bit com & 0x7f)
// Referência Bitwise: https://www.w3schools.com/js/js_bitwise.asp
const lerSyncSafe = (b, o) => ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f);

const BITRATES_MPEG1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BITRATES_MPEG2_L3 = [0, 8, 16, 24, 32, 64, 80, 56, 64, 128, 160, 112, 128, 256, 320, 0];
const SAMPLE_RATES = {
  3: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  0: [11025, 12000, 8000],
};

// Percorre os frames MP3 seguidos a partir de "inicio" e devolve o bitrate médio em bps (0 se amostra pequena)
function mediaBitrateFrames(bytes, inicio) {
  let pos = inicio;
  let somaBitrate = 0;
  let frames = 0;
  let falhas = 0;

  while (pos + 4 < bytes.length && frames < 5000) {
    if (bytes[pos] === 0xff && (bytes[pos + 1] & 0xe0) === 0xe0) {
      const versaoBits = (bytes[pos + 1] >> 3) & 0x03;
      const layerBits = (bytes[pos + 1] >> 1) & 0x03;
      const bitrateIndex = (bytes[pos + 2] >> 4) & 0x0f;
      const freqIndex = (bytes[pos + 2] >> 2) & 0x03;
      const padding = (bytes[pos + 2] >> 1) & 0x01;
      const sampleRate = SAMPLE_RATES[versaoBits]?.[freqIndex];
      if (layerBits === 1 && versaoBits !== 1 && bitrateIndex > 0 && bitrateIndex < 15 && sampleRate) {
        const bitrate = (versaoBits === 3 ? BITRATES_MPEG1_L3 : BITRATES_MPEG2_L3)[bitrateIndex] * 1000;
        const tamFrame = Math.floor(((versaoBits === 3 ? 144000 : 72000) * (bitrate / 1000)) / sampleRate) + padding;
        somaBitrate += bitrate;
        frames++;
        pos += tamFrame;
        continue;
      }
    }
    // Perdeu o sincronismo: tenta achar o próximo frame byte a byte (poucas tentativas)
    if (++falhas > 2000) break;
    pos++;
  }

  return frames >= 50 ? somaBitrate / frames : 0;
}

// Calcula a duração real do MP3 inspecionando o cabeçalho MPEG de áudio e tags Xing/Info (VBR)
// Referência: https://www.w3schools.com/js/js_bitwise.asp
function calcularDuracaoMP3(bytes, totalSize, inicioAudio = 0) {
  if (!bytes || bytes.length < 4) return 0;

  let pos = Math.max(0, inicioAudio);
  const maxBusca = Math.min(bytes.length - 4, pos + 16384);

  while (pos < maxBusca) {
    if (bytes[pos] === 0xff && (bytes[pos + 1] & 0xe0) === 0xe0) {
      const versaoBits = (bytes[pos + 1] >> 3) & 0x03;
      const layerBits = (bytes[pos + 1] >> 1) & 0x03;
      const bitrateIndex = (bytes[pos + 2] >> 4) & 0x0f;
      const freqIndex = (bytes[pos + 2] >> 2) & 0x03;
      const canalMode = (bytes[pos + 3] >> 6) & 0x03;

      if (layerBits === 1 && bitrateIndex > 0 && bitrateIndex < 15 && freqIndex < 3 && versaoBits !== 1) {
        const sampleRate = SAMPLE_RATES[versaoBits]?.[freqIndex];
        const bitrate = (versaoBits === 3 ? BITRATES_MPEG1_L3 : BITRATES_MPEG2_L3)[bitrateIndex];

        if (sampleRate && bitrate) {
          // Detecta cabeçalho Xing / Info em arquivos com bitrate variável (VBR)
          const xingOffset = pos + 4 + (versaoBits === 3 ? (canalMode === 3 ? 17 : 32) : (canalMode === 3 ? 9 : 17));
          if (xingOffset + 12 <= bytes.length) {
            const xingTag = String.fromCharCode(bytes[xingOffset], bytes[xingOffset + 1], bytes[xingOffset + 2], bytes[xingOffset + 3]);
            if (xingTag === 'Xing' || xingTag === 'Info') {
              const flags = (bytes[xingOffset + 4] << 24) | (bytes[xingOffset + 5] << 16) | (bytes[xingOffset + 6] << 8) | bytes[xingOffset + 7];
              if (flags & 0x01) {
                const totalFrames = (bytes[xingOffset + 8] << 24) | (bytes[xingOffset + 9] << 16) | (bytes[xingOffset + 10] << 8) | bytes[xingOffset + 11];
                const samplesPerFrame = versaoBits === 3 ? 1152 : 576;
                const duracaoVBR = Math.round((totalFrames * samplesPerFrame) / sampleRate);
                if (duracaoVBR > 0) return duracaoVBR;
              }
            }
          }

          // Sem cabeçalho Xing: percorre vários frames e usa o bitrate MÉDIO. Em MP3 de bitrate variável (VBR)
          // sem Xing, o primeiro frame engana (ex.: 320 kbps) e a duração fica bem menor que a real.
          const mediaBitrate = mediaBitrateFrames(bytes, pos);
          const bitrateUsado = mediaBitrate || bitrate * 1000;
          const tamanhoAudio = Math.max(0, totalSize - pos);
          const duracaoCBR = Math.round((tamanhoAudio * 8) / bitrateUsado);
          if (duracaoCBR > 0) return duracaoCBR;
        }
      }
    }
    pos++;
  }

  return totalSize > 0 ? Math.round((totalSize * 8) / 160000) : 0;
}

// Percorre os blocos (frames) ID3v2.2, v2.3 e v2.4: TIT2 = Título, TPE1 = Artista, TALB = Álbum, APIC = Capa
// Referência dos Frames ID3v2: https://id3.org/id3v2.3.0#Declared_ID3v2_frames
function extrairID3Binario(bytes) {
  const res = { title: '', artist: '', album: '', pictureBase64: null, mime: 'image/jpeg' };
  try {
    // Verifica se o arquivo começa com as letras "ID3" em ASCII (0x49 = 'I', 0x44 = 'D', 0x33 = '3')
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

// Tenta ler os bytes do arquivo local por XHR (Mobile), Fetch (Web) ou FileSystem do Expo
// Referência Fetch API: https://www.w3schools.com/js/js_api_fetch.asp
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
    const id3Tamanho =
      arquivo.bytes[0] === 0x49 && arquivo.bytes[1] === 0x44 && arquivo.bytes[2] === 0x33
        ? 10 + lerSyncSafe(arquivo.bytes, 6)
        : 0;
    const duracaoReal = calcularDuracaoMP3(arquivo.bytes, arquivo.totalSize, id3Tamanho);

    return {
      title: id3.title || nomeLimpo,
      artist: id3.artist || 'Artista Desconhecido',
      album: id3.album || 'Sem Álbum',
      artwork: id3.pictureBase64 ? `data:${id3.mime};base64,${id3.pictureBase64}` : null,
      duration: duracaoReal,
      // Duração medida nos frames do MP3 (mais confiável que a estimativa do player em VBR sem cabeçalho)
      duracaoConfiavel: duracaoReal > 0 && arquivo.bytes.length > 4096,
    };
  } catch (e) {
    return padrao;
  }
}
