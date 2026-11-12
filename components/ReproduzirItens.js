import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, FlatList, TouchableOpacity, PanResponder, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { extrairTags } from './ExtrairTags';
import { MusicasContext, formatarTempo, MASCOTE, AnimarEntrada, vibrar } from '../config/config';

const ALTURA_LINHA_FILA = 64;
const POSES_TOCANDO = [MASCOTE.fones, MASCOTE.som, MASCOTE.voando];

function ItemFilaArrastavel({ item, index, tocandoAgora, tema, onSelect, onRemove, onReorder }) {
  const [deslocamentoY, setDeslocamentoY] = useState(0);
  const [arrastando, setArrastando] = useState(false);

  // Guarda valores atuais em ref para o PanResponder não usar referências antigas
  // Referência PanResponder (gestos de arrastar): https://reactnative.dev/docs/panresponder
  const dadosRef = useRef({ index, onReorder });
  dadosRef.current = { index, onReorder };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Impede que a rolagem da lista "roube" o gesto no meio do arraste (comum no Android)
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        vibrar(30);
        setArrastando(true);
      },
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
            <Image source={MASCOTE.fones} style={{ width: 34, height: 34 }} />
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
    usuario,
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
    sincronizarEstatisticas,
    tema,
  } = useContext(MusicasContext);

  const [nomeMusica, setNomeMusica] = useState('Nenhuma música na fila');
  const [nomeArtista, setNomeArtista] = useState('Adicione uma faixa para ouvir');
  const [nomeAlbum, setNomeAlbum] = useState('Sem Álbum');
  const [capaAlbum, setCapaAlbum] = useState(null);
  const [modalFilaVisivel, setModalFilaVisivel] = useState(false);
  const [indicePose, setIndicePose] = useState(0);
  const [arrastandoSlider, setArrastandoSlider] = useState(false);
  const [posicaoArrasto, setPosicaoArrasto] = useState(0);
  const arrastoTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (arrastoTimerRef.current) clearTimeout(arrastoTimerRef.current);
    };
  }, []);

  // Hooks de reprodução da biblioteca expo-audio (substituta moderna do expo-av)
  // Referência: https://docs.expo.dev/versions/latest/sdk/audio/
  const source = musicaAtual?.uri && !musicaAtual?.indisponivel ? { uri: musicaAtual.uri } : null;
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  // Animação contínua de pulsação suave do mascote enquanto a música toca
  // Referência: https://reactnative.dev/docs/animated
  const pulsoAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status.playing) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulsoAnim, { toValue: 1.05, duration: 900, useNativeDriver: true }),
          Animated.timing(pulsoAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulsoAnim.setValue(1);
    }
  }, [status.playing]);

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
    // shouldPlayInBackground mantém o áudio tocando com a tela bloqueada ou em outro app
    // Referência: https://docs.expo.dev/versions/latest/sdk/audio/
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Controles na notificação / tela de bloqueio (também evita o Android encerrar o áudio após ~3 min)
  useEffect(() => {
    if (!player || !musicaAtual?.uri || musicaAtual?.indisponivel) return;
    try {
      player.setActiveForLockScreen(true, {
        title: nomeMusica,
        artist: nomeArtista,
        albumTitle: nomeAlbum || undefined,
        artworkUrl: capaAlbum || undefined,
      });
    } catch (e) {}
  }, [player, musicaAtual?.uri, nomeMusica, nomeArtista, nomeAlbum, capaAlbum]);

  useEffect(() => {
    async function carregarMetadados() {
      if (!musicaAtual?.uri) {
        setNomeMusica('Nenhuma música na fila');
        setNomeArtista('Selecione uma faixa para o Nyx tocar');
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
    if (!player) return;
    if (musicaAtual?.uri && !musicaAtual?.indisponivel) {
      player.play();
    } else {
      player.pause();
    }
  }, [musicaAtual?.uri]);

  const alternarPlayPause = () => {
    if (!player) return;
    vibrar(25);
    if (status.playing) player.pause();
    else player.play();
  };

  // Salva a reprodução concluída no armazenamento local e sincroniza com o Firebase se estiver online
  const guardarEstatisticaLocal = async () => {
    try {
      vibrar([0, 35, 50, 35]);
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
      if (usuario?.uid && sincronizarEstatisticas) {
        await sincronizarEstatisticas(usuario.uid);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (status.didJustFinish) {
      guardarEstatisticaLocal();
      avancarMusica();
    }
  }, [status.didJustFinish]);

  const poseMascote = !musicaAtual
    ? MASCOTE.play
    : status.playing
      ? POSES_TOCANDO[indicePose % POSES_TOCANDO.length]
      : MASCOTE.atento;

  const fraseMascote = !musicaAtual
    ? 'Nyx pronto para dar o Play'
    : status.playing
      ? 'Nyx está curtindo o som ♪'
      : 'Nyx aguardando você soltar o som';

  const trocarPoseMascote = () => {
    vibrar(20);
    setIndicePose((prev) => prev + 1);
  };

  const duracaoTotal = (status.duration > 0 ? status.duration : musicaAtual?.tags?.duration) || 0;
  const tempoAtual = arrastandoSlider ? posicaoArrasto : (status.currentTime || 0);
  const maximoSlider = duracaoTotal > 0 ? duracaoTotal : 1;
  const valorSlider = Math.max(0, Math.min(tempoAtual, maximoSlider));

  return (
    <AnimarEntrada gatilho={musicaAtual?.uri} style={[styles.container, { backgroundColor: tema.bg }]}>
      <View style={styles.barraSuperior}>
        <TouchableOpacity
          style={[styles.pilulaMascote, { backgroundColor: tema.card, borderColor: tema.borda }]}
          onPress={trocarPoseMascote}
        >
          <Image source={poseMascote} style={styles.iconePilula} />
          <Text style={[styles.textoPilula, { color: tema.primaria }]}>{fraseMascote}</Text>
        </TouchableOpacity>

        {musicaAtual && (
          <TouchableOpacity
            style={[styles.botaoOpcoes, { backgroundColor: tema.card }]}
            onPress={() => abrirMenuOpcoes(musicaAtual)}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color={tema.primaria} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.palcoCentral}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={trocarPoseMascote}
          style={[styles.capa, { backgroundColor: capaAlbum ? tema.card : tema.primariaClara, borderColor: tema.primaria }]}
        >
          {capaAlbum ? (
            <>
              <Image source={{ uri: capaAlbum }} style={styles.imagemCapa} />
              <Animated.View
                style={[
                  styles.crachaMascoteCapa,
                  { backgroundColor: tema.card, borderColor: tema.primaria, transform: [{ scale: pulsoAnim }] },
                ]}
              >
                <Image source={poseMascote} style={styles.imgCrachaMascote} />
              </Animated.View>
            </>
          ) : (
            <Animated.Image
              source={poseMascote}
              style={[styles.mascoteProtagonista, { transform: [{ scale: pulsoAnim }] }]}
            />
          )}
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={[styles.nomeMusica, { color: tema.texto }]} numberOfLines={1}>
            {nomeMusica}
          </Text>
          <Text style={[styles.nomeArtista, { color: tema.subtexto }]} numberOfLines={1}>
            {nomeArtista} {nomeAlbum ? `• ${nomeAlbum}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.containerSlider}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={maximoSlider}
          value={valorSlider}
          disabled={!musicaAtual?.uri || duracaoTotal <= 0}
          onSlidingStart={(v) => {
            if (arrastoTimerRef.current) clearTimeout(arrastoTimerRef.current);
            setArrastandoSlider(true);
            setPosicaoArrasto(v);
          }}
          onValueChange={(v) => {
            setPosicaoArrasto(v);
          }}
          onSlidingComplete={async (v) => {
            setPosicaoArrasto(v);
            if (player) {
              try {
                await player.seekTo(v);
              } catch (e) {}
            }
            if (arrastoTimerRef.current) clearTimeout(arrastoTimerRef.current);
            arrastoTimerRef.current = setTimeout(() => {
              setArrastandoSlider(false);
            }, 300);
          }}
          minimumTrackTintColor={tema.primaria}
          maximumTrackTintColor={tema.subtexto}
          thumbTintColor={tema.primaria}
        />
        <View style={styles.tempoContainer}>
          <Text style={[styles.textoTempo, { color: tema.subtexto }]}>{formatarTempo(tempoAtual)}</Text>
          <Text style={[styles.textoTempo, { color: tema.subtexto }]}>{formatarTempo(duracaoTotal)}</Text>
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
        style={[styles.botaoVerFila, { backgroundColor: tema.card, borderColor: tema.borda }]}
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
                <View style={styles.filaVazia}>
                  <Image source={MASCOTE.curioso} style={{ width: 80, height: 80, marginBottom: 8 }} />
                  <Text style={{ color: tema.subtexto }}>A fila está vazia.</Text>
                </View>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>
    </AnimarEntrada>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 35 },
  caixaCentralizada: { justifyContent: 'center', alignItems: 'center' },
  barraSuperior: { position: 'absolute', top: 45, width: '88%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  pilulaMascote: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, elevation: 2, gap: 8 },
  iconePilula: { width: 28, height: 28 },
  textoPilula: { fontSize: 13, fontWeight: 'bold' },
  botaoOpcoes: { padding: 8, borderRadius: 20, elevation: 2 },
  palcoCentral: { alignItems: 'center', width: '100%', marginTop: 30 },
  capa: { alignItems: 'center', justifyContent: 'center', width: 255, height: 255, borderRadius: 36, overflow: 'hidden', marginBottom: 18, borderWidth: 2, elevation: 6 },
  imagemCapa: { width: '100%', height: '100%' },
  mascoteProtagonista: { width: 210, height: 210 },
  crachaMascoteCapa: { position: 'absolute', bottom: 10, right: 10, width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', borderWidth: 2, elevation: 5 },
  imgCrachaMascote: { width: 48, height: 48 },
  infoContainer: { alignItems: 'center', width: '85%', marginBottom: 4 },
  nomeMusica: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  nomeArtista: { fontSize: 15, marginTop: 4, textAlign: 'center' },
  containerSlider: { width: '85%', justifyContent: 'center', marginTop: 4, marginBottom: 14 },
  slider: { width: '100%', height: 40 },
  tempoContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: -8 },
  textoTempo: { fontSize: 12 },
  containerControles: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginBottom: 22 },
  pause: { alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35, elevation: 4 },
  controles: { alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 26, elevation: 3 },
  botaoPressionado: { opacity: 0.8, transform: [{ scale: 0.92 }] },
  botaoVerFila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, elevation: 2, gap: 8 },
  textoVerFila: { fontWeight: 'bold', fontSize: 14 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingBottom: 25, maxHeight: '75%' },
  alcaGavetaContainer: { alignItems: 'center', paddingVertical: 14 },
  barraArrasteTopo: { width: 45, height: 5, borderRadius: 3, marginBottom: 10, opacity: 0.5 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold' },
  filaVazia: { alignItems: 'center', marginVertical: 25 },
  filaItem: { flexDirection: 'row', alignItems: 'center', height: ALTURA_LINHA_FILA, borderBottomWidth: 1, borderRadius: 8, paddingHorizontal: 4 },
  alcaArrastarItem: { paddingHorizontal: 8, justifyContent: 'center', height: '100%' },
  filaConteudoClicavel: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  capaFila: { width: 42, height: 42, borderRadius: 8, overflow: 'hidden' },
  filaTexto: { fontSize: 15 },
  filaArtista: { fontSize: 12, marginTop: 2 },
});
