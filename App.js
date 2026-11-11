import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, Modal, TouchableOpacity, FlatList, StyleSheet, Switch, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase, { MusicasContext, MASCOTE, PALETAS_CORES, vibrar } from './config/config';
import { extrairTags } from './components/ExtrairTags';

import Login from './components/Login';
import Cadastro from './components/Cadastro';
import ReproduzirItens from './components/ReproduzirItens';
import Playlists from './components/Playlists';
import TelaPlaylist from './components/TelaPlaylist';
import BuscarItens from './components/BuscarItens';
import ListarItens from './components/ListarItens';
import Estatisticas from './components/Estatisticas';
import TelaAlbum from './components/TelaAlbum';
import TelaArtista from './components/TelaArtista';

const NavegacaoTabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const BuscarStack = createNativeStackNavigator();
const PlaylistsStack = createNativeStackNavigator();

function BuscarNavegacao() {
  return (
    <BuscarStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <BuscarStack.Screen name="BuscarInicio" component={BuscarItens} />
      <BuscarStack.Screen name="Album" component={TelaAlbum} />
      <BuscarStack.Screen name="Artista" component={TelaArtista} />
    </BuscarStack.Navigator>
  );
}

function PlaylistsNavegacao() {
  return (
    <PlaylistsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <PlaylistsStack.Screen name="PlaylistsInicio" component={Playlists} />
      <PlaylistsStack.Screen name="TelaPlaylist" component={TelaPlaylist} />
    </PlaylistsStack.Navigator>
  );
}

function AppTabs() {
  const { tema } = useContext(MusicasContext);
  const icones = {
    Reproduzir: 'play-circle',
    Playlists: 'playlist-music',
    Buscar: 'magnify',
    Listar: 'music-box-multiple',
    Estatísticas: 'chart-bar',
  };

  return (
    <NavegacaoTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: tema.bg },
        tabBarActiveTintColor: tema.primaria,
        tabBarInactiveTintColor: tema.subtexto,
        tabBarStyle: { backgroundColor: tema.card, borderTopColor: tema.borda },
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={icones[route.name] || 'music'} size={size} color={color} />
        ),
      })}
    >
      <NavegacaoTabs.Screen name="Reproduzir" component={ReproduzirItens} />
      <NavegacaoTabs.Screen name="Playlists" component={PlaylistsNavegacao} />
      <NavegacaoTabs.Screen name="Buscar" component={BuscarNavegacao} />
      <NavegacaoTabs.Screen name="Listar" component={ListarItens} />
      <NavegacaoTabs.Screen name="Estatísticas" component={Estatisticas} />
    </NavegacaoTabs.Navigator>
  );
}

export default function App() {
  const [musicas, setMusicas] = useState([]);
  const [listaCarregada, setListaCarregada] = useState(false);
  const [playlistsGlobais, setPlaylistsGlobais] = useState({});
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [temaEscuro, setTemaEscuro] = useState(false);
  const [corPrimaria, setCorPrimaria] = useState('#6C3CE9');
  const [modalTemaVisivel, setModalTemaVisivel] = useState(false);

  const [fila, setFila] = useState([]);
  const [indiceFila, setIndiceFila] = useState(-1);

  const [musicasMenu, setMusicasMenu] = useState([]);
  const [exibirEscolherPlaylist, setExibirEscolherPlaylist] = useState(false);

  const paletaAtual = PALETAS_CORES.find((p) => p.cor === corPrimaria) || PALETAS_CORES[0];
  const tema = {
    escuro: temaEscuro,
    primaria: paletaAtual.cor,
    primariaClara: temaEscuro ? 'rgba(255,255,255,0.12)' : paletaAtual.clara,
    bg: temaEscuro ? '#0F0F17' : '#F2F1F8',
    card: temaEscuro ? '#1B1B29' : '#FFFFFF',
    texto: temaEscuro ? '#F5F5F7' : '#1E1E2C',
    subtexto: temaEscuro ? '#A0A0B8' : '#6E6E85',
    borda: temaEscuro ? '#2C2C40' : '#E6E4F0',
  };

  const musicaAtual = indiceFila >= 0 && indiceFila < fila.length ? fila[indiceFila] : null;

  // Remove da fila músicas que foram apagadas da biblioteca local mantendo o índice correto
  useEffect(() => {
    if (fila.length === 0) return;
    const removidosAntes = fila.slice(0, indiceFila).filter((m) => !musicas.some((lib) => lib.uri === m.uri)).length;
    const novaFila = fila.filter((m) => musicas.some((lib) => lib.uri === m.uri));
    if (novaFila.length !== fila.length) {
      setFila(novaFila);
      setIndiceFila(novaFila.length === 0 ? -1 : Math.min(Math.max(0, indiceFila - removidosAntes), novaFila.length - 1));
    }
  }, [musicas]);

  // Carrega biblioteca e preferências visuais em paralelo ao iniciar
  // Referência Promise.all: https://www.w3schools.com/jsref/jsref_promise_all.asp
  useEffect(() => {
    async function carregarDadosLocais() {
      try {
        const [musicasSalvas, temaSalvo, corSalva] = await Promise.all([
          AsyncStorage.getItem('biblioteca_musicas_local'),
          AsyncStorage.getItem('preferencia_tema_escuro'),
          AsyncStorage.getItem('preferencia_cor_primaria'),
        ]);
        if (temaSalvo !== null) setTemaEscuro(JSON.parse(temaSalvo));
        if (corSalva !== null) setCorPrimaria(corSalva);
        if (musicasSalvas !== null) {
          const lista = JSON.parse(musicasSalvas);
          setMusicas(lista);
          recarregarCapas(lista);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados locais:', e);
      } finally {
        setListaCarregada(true);
      }
    }
    carregarDadosLocais();
  }, []);

  // As capas em Base64 não são salvas no AsyncStorage (limite de espaço), então são relidas dos MP3 em segundo plano.
  // Músicas do mesmo álbum reaproveitam a capa já encontrada, evitando ler o mesmo arquivo várias vezes.
  const recarregarCapas = async (lista) => {
    const capasPorUri = {};
    const capasPorAlbum = {};
    for (const item of lista) {
      if (item.tags?.artwork) continue;
      const album = item.tags?.album;
      if (album && album !== 'Sem Álbum' && capasPorAlbum[album]) {
        capasPorUri[item.uri] = capasPorAlbum[album];
        continue;
      }
      const tags = await extrairTags(item.uri, item.name);
      if (tags.artwork) {
        capasPorUri[item.uri] = tags.artwork;
        if (album) capasPorAlbum[album] = tags.artwork;
      }
    }
    if (Object.keys(capasPorUri).length === 0) return;
    setMusicas((atuais) =>
      atuais.map((m) => (capasPorUri[m.uri] ? { ...m, tags: { ...m.tags, artwork: capasPorUri[m.uri] } } : m))
    );
  };

  // Persiste a lista local (omite capas em Base64 para não exceder o limite do AsyncStorage)
  useEffect(() => {
    if (!listaCarregada) return;
    async function salvarMusicasLocalmente() {
      try {
        const listaLeve = musicas.map((m) => ({
          uri: m.uri,
          name: m.name,
          tags: {
            title: m.tags?.title,
            artist: m.tags?.artist,
            album: m.tags?.album,
            duration: m.tags?.duration,
            artwork: m.tags?.artwork && !m.tags.artwork.startsWith('data:') ? m.tags.artwork : null,
          },
        }));
        await AsyncStorage.setItem('biblioteca_musicas_local', JSON.stringify(listaLeve));
      } catch (e) {
        console.warn('Erro ao salvar lista de músicas:', e);
      }
    }
    salvarMusicasLocalmente();
  }, [musicas, listaCarregada]);

  const alternarTemaEscuro = async (valor) => {
    setTemaEscuro(valor);
    try {
      await AsyncStorage.setItem('preferencia_tema_escuro', JSON.stringify(valor));
    } catch (e) {}
  };

  const escolherCorPrimaria = async (cor) => {
    setCorPrimaria(cor);
    try {
      await AsyncStorage.setItem('preferencia_cor_primaria', cor);
    } catch (e) {}
  };

  const sairDaConta = () => {
    vibrar(40);
    setModalTemaVisivel(false);
    setFila([]);
    setIndiceFila(-1);
    firebase.auth().signOut();
  };

  // Cruza metadados da nuvem (Firebase) com o arquivo MP3 físico presente neste aparelho
  const resolverMusicaLocal = (item) => {
    if (!item) return null;
    return (
      musicas.find(
        (m) =>
          m.uri === item.uri ||
          (m.tags?.title && item.title && m.tags.title.toLowerCase() === item.title.toLowerCase()) ||
          (m.name && item.name && m.name.toLowerCase() === item.name.toLowerCase())
      ) || null
    );
  };

  const formatarItemParaFila = (item) => {
    const local = resolverMusicaLocal(item);
    const base = local || item;
    return {
      uri: base.uri,
      indisponivel: !local && !musicas.some((m) => m.uri === base.uri),
      name: base.name || base.title || base.filename || 'Música',
      tags: {
        title: base.tags?.title || base.title || base.name?.replace('.mp3', '') || 'Música',
        artist: base.tags?.artist || base.artist || 'Artista Desconhecido',
        album: base.tags?.album || base.album || 'Sem Álbum',
        artwork: base.tags?.artwork || base.artwork || null,
        duration: base.tags?.duration || base.duration || 0,
      },
    };
  };

  const tocarAgora = (item, novaLista = null) => {
    const musicaFormatada = formatarItemParaFila(item);

    if (Array.isArray(novaLista)) {
      const filaFormatada = novaLista.map(formatarItemParaFila);
      const idx = filaFormatada.findIndex((m) => m.uri === musicaFormatada.uri);
      setFila(filaFormatada);
      setIndiceFila(idx !== -1 ? idx : 0);
      return;
    }

    const idxExistente = fila.findIndex((m) => m.uri === musicaFormatada.uri);
    if (idxExistente !== -1) {
      setIndiceFila(idxExistente);
    } else {
      const novaFila = [...fila, musicaFormatada];
      setFila(novaFila);
      setIndiceFila(novaFila.length - 1);
    }
  };

  const tocarLista = (listaItens, aleatorio = false) => {
    const filaFinal = listaItens.map(formatarItemParaFila).filter((m) => !m.indisponivel);
    if (filaFinal.length === 0) return;

    // Embaralhamento Fisher-Yates para reprodução aleatória
    // Referência: https://www.w3schools.com/js/js_array_sort.asp
    if (aleatorio) {
      for (let i = filaFinal.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filaFinal[i], filaFinal[j]] = [filaFinal[j], filaFinal[i]];
      }
    }
    setFila(filaFinal);
    setIndiceFila(0);
  };

  const fecharMenuOpcoes = () => {
    setMusicasMenu([]);
    setExibirEscolherPlaylist(false);
  };

  const tocarDeProximo = (itens) => {
    const formatados = (Array.isArray(itens) ? itens : [itens]).map(formatarItemParaFila);
    if (fila.length === 0) {
      setFila(formatados);
      setIndiceFila(0);
    } else {
      const novaFila = [...fila];
      // splice insere os novos itens logo após a música atual sem apagar nenhum elemento
      // Referência: https://www.w3schools.com/jsref/jsref_splice.asp
      novaFila.splice(indiceFila + 1, 0, ...formatados);
      setFila(novaFila);
    }
    fecharMenuOpcoes();
  };

  const adicionarAoFimDaFila = (itens) => {
    const formatados = (Array.isArray(itens) ? itens : [itens]).map(formatarItemParaFila);
    if (fila.length === 0) setIndiceFila(0);
    setFila([...fila, ...formatados]);
    fecharMenuOpcoes();
  };

  const reordenarFila = (deIndex, paraIndex) => {
    if (fila.length <= 1) return;
    const destino = Math.max(0, Math.min(fila.length - 1, paraIndex));
    if (deIndex === destino) return;

    const novaFila = [...fila];
    const [movido] = novaFila.splice(deIndex, 1);
    novaFila.splice(destino, 0, movido);
    setFila(novaFila);

    // Ajusta o índice para não trocar a música que já está tocando
    if (deIndex === indiceFila) setIndiceFila(destino);
    else if (deIndex < indiceFila && destino >= indiceFila) setIndiceFila(indiceFila - 1);
    else if (deIndex > indiceFila && destino <= indiceFila) setIndiceFila(indiceFila + 1);
  };

  const avancarMusica = () => {
    if (indiceFila < fila.length - 1) setIndiceFila((prev) => prev + 1);
  };

  const voltarMusica = () => {
    if (indiceFila > 0) setIndiceFila((prev) => prev - 1);
  };

  const removerDaFila = (indexParaRemover) => {
    const novaFila = fila.filter((_, idx) => idx !== indexParaRemover);
    setFila(novaFila);
    if (indexParaRemover < indiceFila) setIndiceFila(indiceFila - 1);
    else if (indexParaRemover === indiceFila && indiceFila >= novaFila.length) setIndiceFila(novaFila.length - 1);
  };

  const abrirMenuOpcoes = (itemOuArray, irDiretoParaPlaylist = false) => {
    vibrar(40);
    setMusicasMenu(Array.isArray(itemOuArray) ? itemOuArray : [itemOuArray]);
    setExibirEscolherPlaylist(irDiretoParaPlaylist);
  };

  const salvarMusicasNaPlaylist = (nomePlaylist) => {
    if (musicasMenu.length === 0 || !usuario) return;
    vibrar(35);
    const refMusicas = firebase.database().ref(`users/${usuario.uid}/playlists/${nomePlaylist}/musicas`);

    musicasMenu.forEach((item) => {
      refMusicas.push({
        uri: item.uri,
        name: item.name || item.title || 'Música.mp3',
        title: item.tags?.title || item.title || item.name?.replace('.mp3', ''),
        artist: item.tags?.artist || item.artist || 'Artista Desconhecido',
        album: item.tags?.album || item.album || 'Sem Álbum',
        duration: item.tags?.duration || item.duration || 0,
      });
    });
    fecharMenuOpcoes();
  };

  // Envia em lote ao Firebase as estatísticas de reprodução salvas enquanto o app rodava offline
  const sincronizarEstatisticas = async (uid) => {
    try {
      const statsGuardados = await AsyncStorage.getItem('estatisticas_pendentes');
      if (!statsGuardados) return;
      const arrayStats = JSON.parse(statsGuardados);
      if (arrayStats.length === 0) return;

      // Remove caracteres proibidos em caminhos do Firebase Realtime Database (. # $ [ ] /)
      // Referência: https://www.w3schools.com/jsref/jsref_replace.asp
      const limparChave = (txt, padrao) => (txt || '').replace(/[.#$\[\]\/]/g, '').trim() || padrao;
      const agregacao = { artistas: {}, albuns: {}, musicas: {}, tempoMensal: {} };

      arrayStats.forEach((stat) => {
        const artista = limparChave(stat.artista, 'Desconhecido');
        const album = limparChave(stat.album, 'Sem Álbum');
        const titulo = limparChave(stat.titulo, 'Desconhecida');
        const duracao = Math.floor(stat.duracao || 0);
        const dataObj = new Date(stat.data);
        const mesAno = `${String(dataObj.getMonth() + 1).padStart(2, '0')}_${dataObj.getFullYear()}`;

        if (!agregacao.artistas[artista]) agregacao.artistas[artista] = { reprod: 0, segs: 0 };
        agregacao.artistas[artista].reprod += 1;
        agregacao.artistas[artista].segs += duracao;

        agregacao.albuns[album] = (agregacao.albuns[album] || 0) + 1;

        const chaveMusica = `${titulo}_${artista}`;
        if (!agregacao.musicas[chaveMusica]) agregacao.musicas[chaveMusica] = { reprod: 0, titulo, artista };
        agregacao.musicas[chaveMusica].reprod += 1;

        agregacao.tempoMensal[mesAno] = (agregacao.tempoMensal[mesAno] || 0) + duracao;
      });

      // ServerValue.increment soma o valor direto no servidor do Firebase sem sobrescrever o que já existia
      // Referência: https://firebase.google.com/docs/database/web/read-and-write#atomic_server-side_increments
      const inc = firebase.database.ServerValue.increment;
      const updates = {};

      Object.entries(agregacao.artistas).forEach(([artista, v]) => {
        updates[`artistas/${artista}/reproducoes`] = inc(v.reprod);
        updates[`artistas/${artista}/segundosTotais`] = inc(v.segs);
      });
      Object.entries(agregacao.albuns).forEach(([album, reprod]) => {
        updates[`albuns/${album}/reproducoes`] = inc(reprod);
      });
      Object.entries(agregacao.musicas).forEach(([chave, v]) => {
        updates[`musicas/${chave}/reproducoes`] = inc(v.reprod);
        updates[`musicas/${chave}/titulo`] = v.titulo;
        updates[`musicas/${chave}/artista`] = v.artista;
      });
      Object.entries(agregacao.tempoMensal).forEach(([mesAno, segs]) => {
        updates[`tempoMensal/${mesAno}`] = inc(segs);
      });

      await firebase.database().ref(`users/${uid}/estatisticas`).update(updates);
      await AsyncStorage.removeItem('estatisticas_pendentes');
    } catch (e) {}
  };

  // Monitora login/logout e mantém as playlists sincronizadas em tempo real
  useEffect(() => {
    let playlistsRef = null;
    let listenerPlaylists = null;

    const limparListenerPlaylists = () => {
      if (playlistsRef && listenerPlaylists) {
        playlistsRef.off('value', listenerPlaylists);
        playlistsRef = null;
        listenerPlaylists = null;
      }
    };

    const unsubscribeAuth = firebase.auth().onAuthStateChanged((user) => {
      limparListenerPlaylists();
      setUsuario(user);
      if (user) {
        sincronizarEstatisticas(user.uid);
        playlistsRef = firebase.database().ref(`users/${user.uid}/playlists`);
        listenerPlaylists = playlistsRef.on('value', (snap) => {
          setPlaylistsGlobais(snap.val() || {});
        });
      } else {
        setPlaylistsGlobais({});
      }
      setCarregandoAuth(false);
    });

    return () => {
      unsubscribeAuth();
      limparListenerPlaylists();
    };
  }, []);

  if (carregandoAuth || !listaCarregada) {
    return (
      <View style={[styles.carregando, { backgroundColor: tema.bg }]}>
        <StatusBar style={temaEscuro ? 'light' : 'dark'} />
        <Image source={MASCOTE.voando} style={styles.mascoteCarregando} />
        <ActivityIndicator size="large" color={tema.primaria} />
        <Text style={[styles.textoCarregando, { color: tema.subtexto }]}>Nyx está preparando seu som...</Text>
      </View>
    );
  }

  const itemUnicoMenu = musicasMenu.length === 1 ? musicasMenu[0] : null;
  const opcoesMenu = [
    { icone: 'playlist-play', texto: 'Tocar de próximo', acao: () => tocarDeProximo(musicasMenu) },
    { icone: 'playlist-plus', texto: 'Adicionar ao fim da fila', acao: () => adicionarAoFimDaFila(musicasMenu) },
    { icone: 'folder-music-outline', texto: 'Adicionar a uma Playlist', acao: () => setExibirEscolherPlaylist(true) },
  ];

  return (
    <MusicasContext.Provider
      value={{
        musicas, setMusicas, usuario, sairDaConta, playlistsGlobais, resolverMusicaLocal, abrirMenuOpcoes, sincronizarEstatisticas,
        fila, indiceFila, setIndiceFila, musicaAtual,
        tocarAgora, tocarLista, tocarDeProximo, adicionarAoFimDaFila, reordenarFila, avancarMusica, voltarMusica, removerDaFila,
        tema, temaEscuro, alternarTemaEscuro, corPrimaria, escolherCorPrimaria, setModalTemaVisivel,
      }}
    >
      {/* Deixa relógio e bateria claros no modo escuro e escuros no modo claro */}
      <StatusBar style={temaEscuro ? 'light' : 'dark'} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {usuario ? (
            <Stack.Screen name="MainTabs" component={AppTabs} />
          ) : (
            <>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Cadastro" component={Cadastro} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <Modal visible={musicasMenu.length > 0} transparent animationType="fade" onRequestClose={fecharMenuOpcoes}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={fecharMenuOpcoes}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <View style={styles.cabecalhoModalMascote}>
              <Image source={MASCOTE.atento} style={styles.mascoteModalPequeno} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitulo, { color: tema.texto, textAlign: 'left' }]} numberOfLines={1}>
                  {itemUnicoMenu
                    ? itemUnicoMenu.tags?.title || itemUnicoMenu.title || itemUnicoMenu.name?.replace('.mp3', '')
                    : `${musicasMenu.length} músicas selecionadas`}
                </Text>
                {itemUnicoMenu && (
                  <Text style={[styles.modalSubtitulo, { color: tema.subtexto, textAlign: 'left', marginBottom: 0 }]} numberOfLines={1}>
                    {itemUnicoMenu.tags?.artist || itemUnicoMenu.artist || 'Artista Desconhecido'}
                  </Text>
                )}
              </View>
            </View>

            {!exibirEscolherPlaylist ? (
              opcoesMenu.map((op) => (
                <TouchableOpacity key={op.texto} style={[styles.opcaoBotao, { borderBottomColor: tema.borda }]} onPress={op.acao}>
                  <MaterialCommunityIcons name={op.icone} size={24} color={tema.primaria} />
                  <Text style={[styles.opcaoTexto, { color: tema.texto }]}>{op.texto}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ maxHeight: 260, marginTop: 10 }}>
                <Text style={[styles.escolherTitulo, { color: tema.primaria }]}>Escolha a Playlist:</Text>
                <FlatList
                  data={Object.keys(playlistsGlobais)}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.opcaoBotao, { borderBottomColor: tema.borda }]} onPress={() => salvarMusicasNaPlaylist(item)}>
                      <MaterialCommunityIcons name="playlist-music" size={24} color={tema.primaria} />
                      <Text style={[styles.opcaoTexto, { color: tema.texto }]}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={{ textAlign: 'center', color: tema.subtexto, marginVertical: 15 }}>
                      Nenhuma playlist criada. Crie uma na aba Playlists!
                    </Text>
                  }
                />
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modalTemaVisivel} transparent animationType="fade" onRequestClose={() => setModalTemaVisivel(false)}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setModalTemaVisivel(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Image source={MASCOTE.feliz} style={{ width: 64, height: 64, marginBottom: 6 }} />
              <Text style={[styles.modalTitulo, { color: tema.texto }]}>Visual do Nyx</Text>
            </View>

            <View style={[styles.linhaSwitch, { borderBottomColor: tema.borda }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="theme-light-dark" size={24} color={tema.primaria} />
                <Text style={[styles.opcaoTexto, { color: tema.texto, marginLeft: 0 }]}>Modo Escuro</Text>
              </View>
              <Switch value={temaEscuro} onValueChange={alternarTemaEscuro} trackColor={{ false: '#999', true: tema.primaria }} />
            </View>

            <Text style={[styles.escolherTitulo, { color: tema.subtexto, marginTop: 15 }]}>Paleta de Cores:</Text>
            <View style={styles.gradeCores}>
              {PALETAS_CORES.map((p) => (
                <TouchableOpacity
                  key={p.cor}
                  style={[styles.bolinhaCor, { backgroundColor: p.cor }, corPrimaria === p.cor && styles.bolinhaSelecionada]}
                  onPress={() => escolherCorPrimaria(p.cor)}
                >
                  {corPrimaria === p.cor && <MaterialCommunityIcons name="check" size={22} color="#FFF" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </MusicasContext.Provider>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  mascoteCarregando: { width: 110, height: 110 },
  textoCarregando: { fontSize: 15, fontWeight: '600' },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '90%', borderRadius: 20, padding: 20, elevation: 6 },
  cabecalhoModalMascote: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  mascoteModalPequeno: { width: 48, height: 48 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalSubtitulo: { fontSize: 14, textAlign: 'center', marginBottom: 12, marginTop: 2 },
  escolherTitulo: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  opcaoBotao: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  opcaoTexto: { fontSize: 16, marginLeft: 15, fontWeight: '500' },
  linhaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  gradeCores: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  bolinhaCor: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  bolinhaSelecionada: { borderWidth: 3, borderColor: '#FFF' },
});
