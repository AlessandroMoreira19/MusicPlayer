import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import { parseBuffer } from 'music-metadata/lib/core';

export async function extrairTags(uri, nomeArquivoPadrao = 'Música Desconhecida') {
  try {
    let uint8Array;

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      uint8Array = new Uint8Array(arrayBuffer);
    } else {
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
        position: 0,
        length: 2097152, 
      });
      uint8Array = Buffer.from(base64Data, 'base64');
    }

    const metadata = await parseBuffer(uint8Array, 'audio/mpeg', {
      duration: true,
      skipPostHeaders: true,
    });

    const { common, format } = metadata;

    let capaUri = null;
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      const base64Pic = Buffer.from(pic.data).toString('base64');
      const mimeType = pic.format || 'image/jpeg';
      capaUri = `data:${mimeType};base64,${base64Pic}`;
    }

    const nomeLimpo = nomeArquivoPadrao.replace(/\.[^/.]+$/, '');

    return {
      title: common.title || nomeLimpo,
      artist: common.artist || 'Artista Desconhecido',
      album: common.album || 'Sem Álbum',
      artwork: capaUri,
      duration: format?.duration || 0,
    };
  } catch (error) {
    console.warn('Erro ao ler tags:', error);
    const nomeLimpo = nomeArquivoPadrao.replace(/\.[^/.]+$/, '');
    return {
      title: nomeLimpo,
      artist: 'Artista Desconhecido',
      album: 'Sem Álbum',
      artwork: null,
      duration: 0,
    };
  }
}