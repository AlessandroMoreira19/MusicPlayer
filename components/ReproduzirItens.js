import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, FlatList, TouchableOpacity, PanResponder } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extrairTags } from './ExtrairTags';
import { MusicasContext, formatarTempo } from '../App';

const ALTURA_LINHA_FILA = 64;

function ItemFilaArrastavel({ item, index, tocandoAgora, tema, onSelect, onRemove, onReorder }) {
  const [deslocamentoY, setDeslocamentoY] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  // Guarda valores atuais em ref para o PanResponder não usar referências antigas
  const dadosRef = useRef({ index, onReorder });
  dadosRef.current = { index, onReorder };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setArrastando(true),
      onPanResponderMove: (_, gestureState) => setDeslocamentoY(gestureState.dy),
      onPanResponderRelease: (_, gestureState) => {
        // Divide a distância arrastada pela altura fixa do item (64px) para achar a nova posição
        const linhasMovidas = Math.round(gestureState.dy / ALTURA_LINHA_FILA);
        setDeslocamentoY(0);
        setArrastando(false);
        if (linhasMovidas !== 0) {
          const { index: idxAtual, onReorder: reordenar } = dadosRef.current;
          reordenar(idxAtual, idxAtual + linhasMovidas);
        }
      },
      onPanResponderTerminate: () => {
        setDeslocamentoY(0);
        setArrastando(false);
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.filaItem,
        { borderBottomColor: tema.borda, backgroundColor: tocandoAgora ? tema.primariaClara : tema.card },
        arrastando && { transform: [{ translateY: deslocamentoY }], zIndex: 99, elevation: 8, opacity: 0.9 },
      ]}
    >
      <View {...panResponder.panHandlers} style={styles.alcaArrastarItem}>
        <MaterialCommunityIcons name="drag-horizontal-variant" size={24} color={tema.subtexto} />
      </View>

      <TouchableOpacity style={styles.filaConteudoClicavel} onPress={onSelect}>
        {item.tags?.artwork ? (
          <Image source={{ uri: item.tags.artwork }} style={styles.capaFila} />
        ) : (
          <View style={[styles.capaFila, styles.caixaCentralizada, { backgroundColor: tema.primariaClara }]}>
            <MaterialCommunityIcons name="music-note" size={20} color={tema.primaria} />
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            style={[
              styles.filaTexto,
              { color: tocandoAgora ? tema.primaria : tema.texto, fontWeight: tocandoAgora ? 'bold' : '500' },
            ]}
            numberOfLines={1}
          >
            {item.tags?.title || item.name.replace('.mp3', '')}
          </Text>
          <Text style={[styles.filaArtista, { color: tema.subtexto }]} numberOfLines={1}>
            {item.tags?.artist || 'Artista Desconhecido'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={onRemove} style={{ padding: 8 }}>
        <MaterialCommunityIcons name="close" size={20} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );
}

export default function ReproduzirItens() {
  const {
    musicaAtual,
    setMusicas,
    fila,
    indiceFila,
    setIndiceFila,
    avancarMusica,
    voltarMusica,
    removerDaFila,
    reordenarFila,
    abrirMenuOpcoes,
    tema,
  } = useContext(MusicasContext);

  const [nomeMusica, setNomeMusica] = useState('Nenhuma música na fila');
  const [nomeArtista, setNomeArtista] = useState('Adicione uma faixa para ouvir');
  const [nomeAlbum, setNomeAlbum] = useState('Sem Álbum');
  const [capaAlbum, setCapaAlbum] = useState(null);
  const [modalFilaVisivel, setModalFilaVisivel] = useState(false);

  const source = musicaAtual?.uri && !musicaAtual?.indisponivel ? { uri: musicaAtual.uri } : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  // Permite fechar a gaveta da fila arrastando a barra superior para baixo
  const gavetaPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) setModalFilaVisivel(false);
      },
    })
  ).current;

  // Permite reproduzir som mesmo quando a chave física do aparelho está no silencioso
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    async function carregarMetadados() {
      if (!musicaAtual?.uri) {
        setNomeMusica('Nenhuma música na fila');
        setNomeArtista('Selecione uma faixa para ouvir');
        setNomeAlbum('');
        setCapaAlbum(null);
        return;
      }

      if (musicaAtual.tags?.artwork && musicaAtual.tags?.artist !== 'Artista Desconhecido') {
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

        setMusicas((antigas) =>
          antigas.map((m) => (m.uri === musicaAtual.uri ? { ...m, tags: { ...m.tags, ...tags } } : m))
        );
      }
    }
    carregarMetadados();
  }, [musicaAtual?.uri, musicaAtual?.tags?.artwork]);

  // Atualiza a duração estimada pela duração exata lida pelo player de áudio
  useEffect(() => {
    if (musicaAtual?.uri && status.duration > 0) {
      setMusicas((antigas) =>
        antigas.map((m) =>
          m.uri === musicaAtual.uri && (!m.tags?.duration || Math.abs(m.tags.duration - status.duration) > 2)
            ? { ...m, tags: { ...m.tags, duration: status.duration } }
            : m
        )
      );
    }
  }, [status.duration, musicaAtual?.uri]);

  useEffect(() => {
    if (musicaAtual?.uri && player && !musicaAtual?.indisponivel) {
      player.play();
    }
  }, [musicaAtual?.uri]);

  const alternarPlayPause = () => {
    if (!player) return;
    if (status.playing) player.pause();
    else player.play();
  };

  // Salva a reprodução concluída no armazenamento local para futura sincronização com o Firebase
  const guardarEstatisticaLocal = async () => {
    try {
      const statsAnteriores = await AsyncStorage.getItem('estatisticas_pendentes');
      const arrayStats = statsAnteriores ? JSON.parse(statsAnteriores) : [];
      arrayStats.push({
        titulo: nomeMusica || 'Desconhecida',
        artista: nomeArtista || 'Desconhecido',
        album: nomeAlbum || 'Sem Álbum',
        duracao: status.duration || 0,
        data: new Date().toISOString(),
      });
      await AsyncStorage.setItem('estatisticas_pendentes', JSON.stringify(arrayStats));
    } catch (e) {}
  };

  useEffect(() => {
    if (status.didJustFinish) {
      guardarEstatisticaLocal();
      avancarMusica();
    }
  }, [status.didJustFinish]);

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <View style={[styles.mascoteTopo, { backgroundColor: tema.card }]}>
        <Image
          source={status.playing ? require('../assets/mascote_som.png') : require('../assets/mascote.png')}
          style={styles.mascoteImg}
        />
      </View>

      {musicaAtual && (
        <TouchableOpacity
          style={[styles.botaoOpcoes, { backgroundColor: tema.card }]}
          onPress={() => abrirMenuOpcoes(musicaAtual)}
        >
          <MaterialCommunityIcons name="dots-vertical" size={26} color={tema.primaria} />
        </TouchableOpacity>
      )}

      <View style={[styles.capa, { backgroundColor: tema.primaria }]}>
        {capaAlbum ? (
          <Image source={{ uri: capaAlbum }} style={styles.imagemCapa} />
        ) : (
          <MaterialCommunityIcons name="music-circle" size={120} color="white" />
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.nomeMusica, { color: tema.texto }]} numberOfLines={1}>
          {nomeMusica}
        </Text>
        <Text style={[styles.nomeArtista, { color: tema.subtexto }]} numberOfLines={1}>
          {nomeArtista} {nomeAlbum ? `• ${nomeAlbum}` : ''}
        </Text>
      </View>

      <View style={styles.containerSlider}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={status.duration || 1}
          value={status.currentTime || 0}
          onSlidingComplete={(v) => player?.seekTo(v)}
          minimumTrackTintColor={tema.primaria}
          maximumTrackTintColor={tema.subtexto}
          thumbTintColor={tema.primaria}
        />
        <View style={styles.tempoContainer}>
          <Text style={[styles.textoTempo, { color: tema.subtexto }]}>{formatarTempo(status.currentTime)}</Text>
          <Text style={[styles.textoTempo, { color: tema.subtexto }]}>{formatarTempo(status.duration)}</Text>
        </View>
      </View>

      <View style={styles.containerControles}>
        <Pressable
          style={({ pressed }) => [
            styles.controles,
            { backgroundColor: tema.primaria },
            pressed && styles.botaoPressionado,
            indiceFila <= 0 && { opacity: 0.4 },
          ]}
          onPress={voltarMusica}
          disabled={indiceFila <= 0}
        >
          <MaterialCommunityIcons name="skip-previous" size={28} color="white" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.pause, { backgroundColor: tema.primaria }, pressed && styles.botaoPressionado]}
          onPress={alternarPlayPause}
        >
          <MaterialCommunityIcons name={status.playing ? 'pause' : 'play'} size={34} color="white" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.controles,
            { backgroundColor: tema.primaria },
            pressed && styles.botaoPressionado,
            indiceFila >= fila.length - 1 && { opacity: 0.4 },
          ]}
          onPress={avancarMusica}
          disabled={indiceFila >= fila.length - 1}
        >
          <MaterialCommunityIcons name="skip-next" size={28} color="white" />
        </Pressable>
      </View>

      <TouchableOpacity
        style={[styles.botaoVerFila, { backgroundColor: tema.card }]}
        onPress={() => setModalFilaVisivel(true)}
      >
        <MaterialCommunityIcons name="playlist-music-outline" size={22} color={tema.primaria} />
        <Text style={[styles.textoVerFila, { color: tema.primaria }]}>Fila de Reprodução ({fila.length})</Text>
      </TouchableOpacity>

      <Modal visible={modalFilaVisivel} transparent animationType="slide" onRequestClose={() => setModalFilaVisivel(false)}>
        <Pressable style={styles.modalFundo} onPress={() => setModalFilaVisivel(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: tema.card }]} onPress={(e) => e.stopPropagation()}>
            <View {...gavetaPanResponder.panHandlers} style={styles.alcaGavetaContainer}>
              <View style={[styles.barraArrasteTopo, { backgroundColor: tema.subtexto }]} />
              <Text style={[styles.modalTitulo, { color: tema.texto }]}>Fila de Reprodução</Text>
              <Text style={{ fontSize: 12, color: tema.subtexto }}>
                Arraste pelo ícone lateral para reordenar ou toque fora para sair
              </Text>
            </View>

            <FlatList
              data={fila}
              keyExtractor={(item, index) => `${item.uri}_${index}`}
              renderItem={({ item, index }) => (
                <ItemFilaArrastavel
                  item={item}
                  index={index}
                  tocandoAgora={index === indiceFila}
                  tema={tema}
                  onSelect={() => setIndiceFila(index)}
                  onRemove={() => removerDaFila(index)}
                  onReorder={reordenarFila}
                />
              )}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginVertical: 30, color: tema.subtexto }}>A fila está vazia.</Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  caixaCentralizada: { justifyContent: 'center', alignItems: 'center' },
  mascoteTopo: { position: 'absolute', top: 46, left: 22, zIndex: 10, padding: 4, borderRadius: 22, elevation: 3 },
  mascoteImg: { width: 34, height: 34 },
  botaoOpcoes: { position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 8, borderRadius: 20, elevation: 3 },
  capa: { alignItems: 'center', justifyContent: 'center', width: 270, height: 270, borderRadius: 35, overflow: 'hidden', marginBottom: 20, elevation: 6 },
  imagemCapa: { width: '100%', height: '100%' },
  infoContainer: { alignItems: 'center', width: '85%', marginBottom: 5 },
  nomeMusica: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  nomeArtista: { fontSize: 15, marginTop: 4, textAlign: 'center' },
  containerSlider: { width: '85%', justifyContent: 'center', marginTop: 5, marginBottom: 15 },
  slider: { width: '100%', height: 40 },
  tempoContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: -8 },
  textoTempo: { fontSize: 12 },
  containerControles: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginBottom: 25 },
  pause: { alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35, elevation: 4 },
  controles: { alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 26, elevation: 3 },
  botaoPressionado: { opacity: 0.8, transform: [{ scale: 0.92 }] },
  botaoVerFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, elevation: 2, gap: 8 },
  textoVerFila: { fontWeight: 'bold', fontSize: 14 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingBottom: 25, maxHeight: '75%' },
  alcaGavetaContainer: { alignItems: 'center', paddingVertical: 14 },
  barraArrasteTopo: { width: 45, height: 5, borderRadius: 3, marginBottom: 10, opacity: 0.5 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold' },
  filaItem: { flexDirection: 'row', alignItems: 'center', height: ALTURA_LINHA_FILA, borderBottomWidth: 1, borderRadius: 8, paddingHorizontal: 4 },
  alcaArrastarItem: { paddingHorizontal: 8, justifyContent: 'center', height: '100%' },
  filaConteudoClicavel: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  capaFila: { width: 42, height: 42, borderRadius: 6 },
  filaTexto: { fontSize: 15 },
  filaArtista: { fontSize: 12, marginTop: 2 },
});
