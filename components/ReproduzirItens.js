import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, FlatList, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extrairTags } from './ExtrairTags';
import { MusicasContext } from '../App';

export default function ReproduzirItens() {
  const {
    musicaAtual, fila, indiceFila, setIndiceFila,
    avancarMusica, voltarMusica, removerDaFila, abrirMenuOpcoes
  } = useContext(MusicasContext);
  
  const [nomeMusica, setNomeMusica] = useState('Nenhuma música na fila');
  const [nomeArtista, setNomeArtista] = useState('Adicione uma faixa para ouvir');
  const [nomeAlbum, setNomeAlbum] = useState('Sem Álbum');
  const [capaAlbum, setCapaAlbum] = useState(null);
  const [modalFilaVisivel, setModalFilaVisivel] = useState(false);

  const source = musicaAtual?.uri ? { uri: musicaAtual.uri } : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
  }, []);

  useEffect(() => {
    async function carregarMetadados() {
      if (musicaAtual?.uri) {
        if (musicaAtual.tags?.artwork) {
          setNomeMusica(musicaAtual.tags.title);
          setNomeArtista(musicaAtual.tags.artist);
          setNomeAlbum(musicaAtual.tags.album || 'Sem Álbum');
          setCapaAlbum(musicaAtual.tags.artwork);
        } else {
          const tags = await extrairTags(musicaAtual.uri, musicaAtual.name);
          setNomeMusica(tags.title);
          setNomeArtista(tags.artist);
          setNomeAlbum(tags.album);
          setCapaAlbum(tags.artwork);
        }
      } else {
        setNomeMusica('Nenhuma música na fila');
        setNomeArtista('Selecione uma faixa para ouvir');
        setCapaAlbum(null);
      }
    }
    carregarMetadados();
  }, [musicaAtual?.uri]);

  useEffect(() => {
    if (musicaAtual?.uri && player) player.play();
  }, [musicaAtual?.uri]);

  const guardarEstatisticaLocal = async () => {
    try {
      const novaEstatistica = {
        titulo: nomeMusica || 'Desconhecida',
        artista: nomeArtista || 'Desconhecido',
        album: nomeAlbum || 'Sem Álbum',
        duracao: status.duration || 0,
        data: new Date().toISOString()
      };
      const statsAnteriores = await AsyncStorage.getItem('estatisticas_pendentes');
      const arrayStats = statsAnteriores ? JSON.parse(statsAnteriores) : [];
      arrayStats.push(novaEstatistica);
      await AsyncStorage.setItem('estatisticas_pendentes', JSON.stringify(arrayStats));
    } catch (error) {}
  };

  useEffect(() => {
    if (status.didJustFinish) {
      guardarEstatisticaLocal();
      avancarMusica();
    }
  }, [status.didJustFinish]);

  const alternarPlayPause = () => status.playing ? player.pause() : player.play();

  const formatarTempo = (segundos) => {
    if (!segundos) return '00:00';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  return (
    <View style={styles.container}>
      {musicaAtual && (
        <TouchableOpacity style={styles.botaoOpcoes} onPress={() => abrirMenuOpcoes(musicaAtual)}>
          <MaterialCommunityIcons name="dots-vertical" size={28} color="purple" />
        </TouchableOpacity>
      )}

      <View style={styles.capa}>
        {capaAlbum ? <Image source={{ uri: capaAlbum }} style={styles.imagemCapa} /> : <MaterialCommunityIcons name="music-circle" size={120} color="white" />}
      </View>
      
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
          onSlidingComplete={(v) => player?.seekTo(v)}
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
          style={({ pressed }) => [styles.controles, pressed && styles.botaoPressionado, indiceFila <= 0 && { opacity: 0.4 }]}
          onPress={voltarMusica}
          disabled={indiceFila <= 0}
        >
          <MaterialCommunityIcons name="skip-previous" size={28} color="white" />
        </Pressable>

        <Pressable style={({ pressed }) => [styles.pause, pressed && styles.botaoPressionado]} onPress={alternarPlayPause}>
          <MaterialCommunityIcons name={status.playing ? 'pause' : 'play'} size={32} color="white" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.controles, pressed && styles.botaoPressionado, indiceFila >= fila.length - 1 && { opacity: 0.4 }]}
          onPress={avancarMusica}
          disabled={indiceFila >= fila.length - 1}
        >
          <MaterialCommunityIcons name="skip-next" size={28} color="white" />
        </Pressable>
      </View>

      <TouchableOpacity style={styles.botaoVerFila} onPress={() => setModalFilaVisivel(true)}>
        <MaterialCommunityIcons name="playlist-music-outline" size={22} color="purple" />
        <Text style={styles.textoVerFila}>Fila de Reprodução ({fila.length})</Text>
      </TouchableOpacity>

      <Modal visible={modalFilaVisivel} transparent={true} animationType="slide" onRequestClose={() => setModalFilaVisivel(false)}>
        <View style={styles.modalFundo}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo}>Fila de Reprodução</Text>
            <FlatList
              data={fila}
              keyExtractor={(item, index) => `${item.uri}_${index}`}
              renderItem={({ item, index }) => {
                const tocandoAgora = index === indiceFila;
                return (
                  <TouchableOpacity
                    style={[styles.filaItem, tocandoAgora && styles.filaItemAtivo]}
                    onPress={() => setIndiceFila(index)}
                  >
                    <MaterialCommunityIcons
                      name={tocandoAgora ? "volume-high" : "music-note"}
                      size={22}
                      color={tocandoAgora ? "#1DB954" : "purple"}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.filaTexto, tocandoAgora && { color: '#1DB954', fontWeight: 'bold' }]} numberOfLines={1}>
                        {item.tags?.title || item.name.replace('.mp3', '')}
                      </Text>
                      <Text style={styles.filaArtista} numberOfLines={1}>
                        {item.tags?.artist || 'Artista Desconhecido'}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removerDaFila(index)} style={{ padding: 6 }}>
                      <MaterialCommunityIcons name="close" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={{ textAlign: 'center', marginVertical: 20, color: '#666' }}>A fila está vazia.</Text>}
            />
            <TouchableOpacity style={styles.modalBotaoFechar} onPress={() => setModalFilaVisivel(false)}>
              <Text style={styles.modalBotaoTexto}>Fechar Fila</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D3D3D3', position: 'relative' },
  botaoOpcoes: { position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 8, backgroundColor: '#FFF', borderRadius: 20, elevation: 3 },
  capa: { backgroundColor: 'purple', alignItems: 'center', justifyContent: 'center', width: 280, height: 280, borderRadius: 35, overflow: 'hidden', marginBottom: 20, elevation: 5 },
  imagemCapa: { width: '100%', height: '100%' },
  infoContainer: { alignItems: 'center', width: '80%', marginBottom: 5 },
  nomeMusica: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  nomeArtista: { fontSize: 16, color: '#666', marginTop: 4, textAlign: 'center' },
  containerSlider: { width: '80%', justifyContent: 'center', marginTop: 5, marginBottom: 15 },
  slider: { width: '100%', height: 40 },
  tempoContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: -10 },
  textoTempo: { fontSize: 12, color: '#555' },
  containerControles: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 25 },
  pause: { backgroundColor: 'purple', alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35, elevation: 4 },
  controles: { backgroundColor: 'purple', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 26, elevation: 3 },
  botaoPressionado: { backgroundColor: '#6c3483', transform: [{ scale: 0.9 }] },
  botaoVerFila: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, elevation: 2, gap: 8 },
  textoVerFila: { color: 'purple', fontWeight: 'bold', fontSize: 14 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 15 },
  filaItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  filaItemAtivo: { backgroundColor: '#f4fff8', borderRadius: 8, paddingHorizontal: 8 },
  filaTexto: { fontSize: 15, color: '#333' },
  filaArtista: { fontSize: 12, color: '#888' },
  modalBotaoFechar: { backgroundColor: 'purple', padding: 14, borderRadius: 10, marginTop: 15, alignItems: 'center' },
  modalBotaoTexto: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});