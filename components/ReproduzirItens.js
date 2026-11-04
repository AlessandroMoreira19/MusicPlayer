import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

// Importa a função que criamos para ler os metadados
import { extrairTags } from './ExtrairTags';

export default function ReproduzirItens({ route }) {
  // 1. Variáveis de estado para guardar os metadados
  const [nomeMusica, setNomeMusica] = useState('Nenhuma música selecionada');
  const [nomeArtista, setNomeArtista] = useState('Selecione uma faixa para ouvir');
  const [capaAlbum, setCapaAlbum] = useState(null);

  const musicaAtual = route.params?.musicaSelecionada || null;
  const source = musicaAtual?.uri ? { uri: musicaAtual.uri } : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  }, []);

  // 2. Efeito para carregar as tags assim que a uri da música mudar
  useEffect(() => {
    async function carregarMetadados() {
      if (musicaAtual?.uri) {
        // Mostra estado de carregamento enquanto lê o arquivo
        setNomeMusica('Carregando metadados...');
        setCapaAlbum(null);

        // Chama a função do ExtrairTags.js
        const tags = await extrairTags(musicaAtual.uri, musicaAtual.filename);
        
        // Salva os resultados nas variáveis de estado
        setNomeMusica(tags.title);
        setNomeArtista(tags.artist);
        setCapaAlbum(tags.artwork);
      }
    }

    carregarMetadados();
  }, [musicaAtual?.uri]);

  useEffect(() => {
    if (musicaAtual?.uri && player) {
      player.play();
    }
  }, [musicaAtual?.uri]);

  useEffect(() => {
    if (status.didJustFinish && aoTerminar) {
      aoTerminar();
    }
  }, [status.didJustFinish]);

  const alternarPlayPause = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  // Função auxiliar para formatar os segundos em "MM:SS"
  const formatarTempo = (segundos) => {
    if (!segundos) return '00:00';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  return (
    <View style={styles.container}>
      
      {/* 3. Renderiza a Capa do Álbum ou um ícone padrão */}
      <View style={styles.capa}>
        {capaAlbum ? (
          <Image source={{ uri: capaAlbum }} style={styles.imagemCapa} />
        ) : (
          <MaterialCommunityIcons name="music-circle" size={120} color="white" />
        )}
      </View>
      
      {/* 4. Renderiza o Nome da Música e o Artista */}
      <View style={styles.infoContainer}>
        <Text style={styles.nomeMusica} numberOfLines={1}>{nomeMusica}</Text>
        <Text style={styles.nomeArtista} numberOfLines={1}>{nomeArtista}</Text>
      </View>

      <View style={styles.containerSlider}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={status.duration || 1}
          value={status.currentTime || 0}
          onSlidingComplete={(valor) => {
            if (player) player.seekTo(valor);
          }}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#000000"
        />
        <View style={styles.tempoContainer}>
          <Text style={styles.textoTempo}>{formatarTempo(status.currentTime)}</Text>
          <Text style={styles.textoTempo}>{formatarTempo(status.duration)}</Text>
        </View>
      </View>

      <View style={styles.containerControles}>
        <Pressable
          style={({ pressed }) => [styles.controles, pressed && styles.botaoPressionado]}
          onPress={() => console.log('Anterior')}>
          <MaterialCommunityIcons name="skip-previous" size={24} color="black" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.pause, pressed && styles.botaoPressionado]}
          onPress={alternarPlayPause}>
          <MaterialCommunityIcons name={status.playing ? 'pause' : 'play'} size={24} color="black" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.controles, pressed && styles.botaoPressionado]}
          onPress={() => console.log('Próximo')}>
          <MaterialCommunityIcons name="skip-next" size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D3D3D3' },
  capa: {
    backgroundColor: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
    borderRadius: 40,
    overflow: 'hidden', // Importante para a imagem respeitar o borderRadius
    marginBottom: 20,
    elevation: 5, // Sombra no Android
  },
  imagemCapa: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    alignItems: 'center',
    width: '80%',
    marginBottom: 10,
  },
  nomeMusica: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  nomeArtista: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  containerSlider: {
    width: '80%',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  slider: { width: '100%', height: 40 },
  tempoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: -10,
  },
  textoTempo: {
    fontSize: 12,
    color: '#555',
  },
  containerControles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  pause: {
    backgroundColor: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  controles: {
    backgroundColor: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  botaoPressionado: {
    backgroundColor: '#6c3483',
    transform: [{ scale: 0.85 }],
  },
});