import { Buffer } from 'buffer';
import process from 'process';
import { TextDecoder, TextEncoder } from 'text-encoding';

global.Buffer = global.Buffer || Buffer;
global.process = global.process || process;
global.TextDecoder = global.TextDecoder || TextDecoder;
global.TextEncoder = global.TextEncoder || TextEncoder;

import React, { useState, useEffect, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator, Modal, TouchableOpacity, FlatList, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from './config/config';

import Login from './components/Login';
import Cadastro from './components/Cadastro';
import ReproduzirItens from './components/ReproduzirItens';
import Playlists from './components/Playlists';
import TelaPlaylist from './components/TelaPlaylist';
import BuscarItens from './components/BuscarItens';
import ListarItens from './components/ListarItens';
import Conquistas from './components/Conquistas';
import TelaAlbum from './components/TelaAlbum';
import TelaArtista from './components/TelaArtista';

export const MusicasContext = createContext();

export const PALETAS_CORES = [
  { nome: 'Roxo Clássico', cor: '#7B1FA2', clara: '#f2e6ff' },
  { nome: 'Verde Spotify', cor: '#1DB954', clara: '#e6f9ed' },
  { nome: 'Azul Oceano', cor: '#0288D1', clara: '#e1f5fe' },
  { nome: 'Vermelho Crimson', cor: '#E53935', clara: '#ffebee' },
  { nome: 'Laranja Sunset', cor: '#FF6D00', clara: '#fff3e0' },
  { nome: 'Rosa Neon', cor: '#D81B60', clara: '#fce4ec' },
];

const NavegacaoTabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const BuscarStack = createNativeStackNavigator();
const PlaylistsStack = createNativeStackNavigator();

function BuscarNavegacao() {
  return (
    <BuscarStack.Navigator screenOptions={{ headerShown: false }}>
      <BuscarStack.Screen name="BuscarInicio" component={BuscarItens} />
      <BuscarStack.Screen name="Album" component={TelaAlbum} />
      <BuscarStack.Screen name="Artista" component={TelaArtista} />
    </BuscarStack.Navigator>
  );
}

function PlaylistsNavegacao() {
  return (
    <PlaylistsStack.Navigator screenOptions={{ headerShown: false }}>
      <PlaylistsStack.Screen name="PlaylistsInicio" component={Playlists} />
      <PlaylistsStack.Screen name="TelaPlaylist" component={TelaPlaylist} />
    </PlaylistsStack.Navigator>
  );
}

function AppTabs() {
  const { tema } = React.useContext(MusicasContext);
  return (
    <NavegacaoTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tema.primaria,
        tabBarInactiveTintColor: tema.subtexto,
        tabBarStyle: {
          backgroundColor: tema.card,
          borderTopColor: tema.borda,
        },
        tabBarIcon: ({ color, size }) => {
          const icones = {
            Reproduzir: 'play-circle',
            Playlists: 'playlist-music',
            Listar: 'music-box-multiple',
            Conquistas: 'trophy',
            Buscar: 'magnify',
          };
          return <MaterialCommunityIcons name={icones[route.name] || 'music'} size={size} color={color} />;
        },
      })}
    >
      <NavegacaoTabs.Screen name="Reproduzir" component={ReproduzirItens} />
      <NavegacaoTabs.Screen name="Playlists" component={PlaylistsNavegacao} />
      <NavegacaoTabs.Screen name="Listar" component={ListarItens} />
      <NavegacaoTabs.Screen name="Conquistas" component={Conquistas} />
      <NavegacaoTabs.Screen name="Buscar" component={BuscarNavegacao} />
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
  const [corPrimaria, setCorPrimaria] = useState('#7B1FA2');
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
    bg: temaEscuro ? '#121212' : '#E5E5E5',
    card: temaEscuro ? '#1E1E1E' : '#FFFFFF',
    texto: temaEscuro ? '#F5F5F5' : '#222222',
    subtexto: temaEscuro ? '#AAAAAA' : '#666666',
    borda: temaEscuro ? '#333333' : '#EEEEEE',
  };

  const musicaAtual = indiceFila >= 0 && indiceFila < fila.length ? fila[indiceFila] : null;

  useEffect(() => {
    if (fila.length === 0) return;
    const novaFila = fila.filter((m) => musicas.some((lib) => lib.uri === m.uri));
    if (novaFila.length !== fila.length) {
      setFila(novaFila);
      if (indiceFila >= novaFila.length) {
        setIndiceFila(novaFila.length - 1);
      }
    }
  }, [musicas]);

  useEffect(() => {
    async function carregarDadosLocais() {
      try {
        const [musicasSalvas, temaSalvo, corSalva] = await Promise.all([
          AsyncStorage.getItem('biblioteca_musicas_local'),
          AsyncStorage.getItem('preferencia_tema_escuro'),
          AsyncStorage.getItem('preferencia_cor_primaria'),
        ]);

        if (temaSalvo !== null) setTemaEscuro(JSON.parse(temaSalvo));
        if (corSalva) setCorPrimaria(corSalva);

        if (musicasSalvas) {
          const listaParseada = JSON.parse(musicasSalvas);
          const listaComCapas = await Promise.all(
            listaParseada.map(async (item) => {
              const chaveCapa = `capa_musica_${item.name}`;
              const capaSalva = await AsyncStorage.getItem(chaveCapa);
              return {
                ...item,
                tags: {
                  ...item.tags,
                  artwork: capaSalva || item.tags?.artwork || null,
                },
              };
            })
          );
          setMusicas(listaComCapas);
        }
      } catch (e) {
        console.warn('Erro ao carregar dados locais:', e);
      } finally {
        setListaCarregada(true);
      }
    }
    carregarDadosLocais();
  }, []);

  useEffect(() => {
    if (!listaCarregada) return;
    async function salvarMusicasLocalmente() {
      try {
        const listaLeve = [];
        for (const m of musicas) {
          if (m.tags?.artwork) {
            try {
              await AsyncStorage.setItem(`capa_musica_${m.name}`, m.tags.artwork);
            } catch (eCapa) {}
          }
          listaLeve.push({
            uri: m.uri,
            name: m.name,
            tags: {
              title: m.tags?.title,
              artist: m.tags?.artist,
              album: m.tags?.album,
              duration: m.tags?.duration,
              artwork: null,
            },
          });
        }
        await AsyncStorage.setItem('biblioteca_musicas_local', JSON.stringify(listaLeve));
      } catch (e) {
        console.warn('Erro ao salvar lista de músicas:', e);
      }
    }
    salvarMusicasLocalmente();
  }, [musicas, listaCarregada]);

  const alternarTemaEscuro = async (valor) => {
    setTemaEscuro(valor);
    await AsyncStorage.setItem('preferencia_tema_escuro', JSON.stringify(valor));
  };

  const escolherCorPrimaria = async (cor) => {
    setCorPrimaria(cor);
    await AsyncStorage.setItem('preferencia_cor_primaria', cor);
  };

  const resolverMusicaLocal = (item) => {
    if (!item) return null;
    const encontrada = musicas.find(
      (m) =>
        m.uri === item.uri ||
        (m.tags?.title && item.title && m.tags.title.toLowerCase() === item.title.toLowerCase()) ||
        (m.name && item.name && m.name.toLowerCase() === item.name.toLowerCase())
    );
    return encontrada || null;
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

    if (novaLista && Array.isArray(novaLista)) {
      const filaFormatada = novaLista.map(formatarItemParaFila);
      setFila(filaFormatada);
      const idx = filaFormatada.findIndex((m) => m.uri === musicaFormatada.uri);
      setIndiceFila(idx !== -1 ? idx : 0);
    } else {
      setFila((filaAntiga) => {
        const idxExistente = filaAntiga.findIndex((m) => m.uri === musicaFormatada.uri);
        if (idxExistente !== -1) {
          setIndiceFila(idxExistente);
          return filaAntiga;
        }
        const nova = [...filaAntiga, musicaFormatada];
        setIndiceFila(nova.length - 1);
        return nova;
      });
    }
  };

  const tocarLista = (listaItens, aleatorio = false) => {
    const disponiveis = listaItens.map(formatarItemParaFila).filter((m) => !m.indisponivel);
    if (disponiveis.length === 0) return;

    let filaFinal = [...disponiveis];
    if (aleatorio) {
      for (let i = filaFinal.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filaFinal[i], filaFinal[j]] = [filaFinal[j], filaFinal[i]];
      }
    }
    setFila(filaFinal);
    setIndiceFila(0);
  };

  const tocarDeProximo = (itens) => {
    const arrayItens = Array.isArray(itens) ? itens : [itens];
    const formatados = arrayItens.map(formatarItemParaFila);

    setFila((filaAntiga) => {
      if (filaAntiga.length === 0) {
        setIndiceFila(0);
        return formatados;
      }
      const nova = [...filaAntiga];
      nova.splice(indiceFila + 1, 0, ...formatados);
      return nova;
    });
    fecharMenuOpcoes();
  };

  const adicionarAoFimDaFila = (itens) => {
    const arrayItens = Array.isArray(itens) ? itens : [itens];
    const formatados = arrayItens.map(formatarItemParaFila);

    setFila((filaAntiga) => {
      if (filaAntiga.length === 0) setIndiceFila(0);
      return [...filaAntiga, ...formatados];
    });
    fecharMenuOpcoes();
  };

  const reordenarFila = (deIndex, paraIndex) => {
    if (paraIndex < 0 || paraIndex >= fila.length || deIndex === paraIndex) return;
    setFila((filaAntiga) => {
      const nova = [...filaAntiga];
      const [movido] = nova.splice(deIndex, 1);
      nova.splice(paraIndex, 0, movido);

      if (deIndex === indiceFila) {
        setIndiceFila(paraIndex);
      } else if (deIndex < indiceFila && paraIndex >= indiceFila) {
        setIndiceFila(indiceFila - 1);
      } else if (deIndex > indiceFila && paraIndex <= indiceFila) {
        setIndiceFila(indiceFila + 1);
      }
      return nova;
    });
  };

  const avancarMusica = () => {
    if (indiceFila < fila.length - 1) setIndiceFila((prev) => prev + 1);
  };

  const voltarMusica = () => {
    if (indiceFila > 0) setIndiceFila((prev) => prev - 1);
  };

  const removerDaFila = (indexParaRemover) => {
    setFila((filaAntiga) => {
      const nova = filaAntiga.filter((_, idx) => idx !== indexParaRemover);
      if (indexParaRemover < indiceFila) {
        setIndiceFila((prev) => prev - 1);
      } else if (indexParaRemover === indiceFila && indiceFila >= nova.length) {
        setIndiceFila(nova.length - 1);
      }
      return nova;
    });
  };

  const abrirMenuOpcoes = (itemOuArray, irDiretoParaPlaylist = false) => {
    const lista = Array.isArray(itemOuArray) ? itemOuArray : [itemOuArray];
    setMusicasMenu(lista);
    setExibirEscolherPlaylist(irDiretoParaPlaylist);
  };

  const fecharMenuOpcoes = () => {
    setMusicasMenu([]);
    setExibirEscolherPlaylist(false);
  };

  const salvarMusicasNaPlaylist = (nomePlaylist) => {
    if (musicasMenu.length === 0 || !usuario) return;
    const refMusicas = firebase.database().ref(`users/${usuario.uid}/playlists/${nomePlaylist}/musicas`);

    musicasMenu.forEach((item) => {
      const novaMusica = {
        uri: item.uri,
        name: item.name || item.title || 'Música.mp3',
        title: item.tags?.title || item.title || item.name?.replace('.mp3', ''),
        artist: item.tags?.artist || item.artist || 'Artista Desconhecido',
        album: item.tags?.album || item.album || 'Sem Álbum',
        duration: item.tags?.duration || item.duration || 0,
      };
      refMusicas.push(novaMusica);
    });
    fecharMenuOpcoes();
  };

  const sincronizarEstatisticas = async (uid) => {
    try {
      const statsGuardados = await AsyncStorage.getItem('estatisticas_pendentes');
      if (!statsGuardados) return;
      const arrayStats = JSON.parse(statsGuardados);
      if (arrayStats.length === 0) return;

      const agregacao = { artistas: {}, albuns: {}, musicas: {}, tempoMensal: {} };

      arrayStats.forEach((stat) => {
        const artista = stat.artista.replace(/[.#$\[\]]/g, '').trim() || 'Desconhecido';
        const album = stat.album.replace(/[.#$\[\]]/g, '').trim() || 'Sem Álbum';
        const titulo = (stat.titulo || 'Desconhecida').replace(/[.#$\[\]]/g, '').trim();
        const duracao = Math.floor(stat.duracao);
        const dataObj = new Date(stat.data);
        const mesAno = `${String(dataObj.getMonth() + 1).padStart(2, '0')}_${dataObj.getFullYear()}`;

        if (!agregacao.artistas[artista]) agregacao.artistas[artista] = { reprod: 0, segs: 0 };
        agregacao.artistas[artista].reprod += 1;
        agregacao.artistas[artista].segs += duracao;

        if (!agregacao.albuns[album]) agregacao.albuns[album] = { reprod: 0 };
        agregacao.albuns[album].reprod += 1;

        const chaveMusica = `${titulo}_${artista}`.replace(/[.#$\[\]\/]/g, '');
        if (!agregacao.musicas[chaveMusica]) agregacao.musicas[chaveMusica] = { reprod: 0, titulo, artista };
        agregacao.musicas[chaveMusica].reprod += 1;

        if (!agregacao.tempoMensal[mesAno]) agregacao.tempoMensal[mesAno] = 0;
        agregacao.tempoMensal[mesAno] += duracao;
      });

      const updates = {};
      Object.keys(agregacao.artistas).forEach((artista) => {
        updates[`artistas/${artista}/reproducoes`] = firebase.database.ServerValue.increment(agregacao.artistas[artista].reprod);
        updates[`artistas/${artista}/segundosTotais`] = firebase.database.ServerValue.increment(agregacao.artistas[artista].segs);
      });
      Object.keys(agregacao.albuns).forEach((album) => {
        updates[`albuns/${album}/reproducoes`] = firebase.database.ServerValue.increment(agregacao.albuns[album].reprod);
      });
      Object.keys(agregacao.musicas).forEach((chave) => {
        updates[`musicas/${chave}/reproducoes`] = firebase.database.ServerValue.increment(agregacao.musicas[chave].reprod);
        updates[`musicas/${chave}/titulo`] = agregacao.musicas[chave].titulo;
        updates[`musicas/${chave}/artista`] = agregacao.musicas[chave].artista;
      });
      Object.keys(agregacao.tempoMensal).forEach((mesAno) => {
        updates[`tempoMensal/${mesAno}`] = firebase.database.ServerValue.increment(agregacao.tempoMensal[mesAno]);
      });

      await firebase.database().ref(`users/${uid}/conquistas`).update(updates);
      await AsyncStorage.removeItem('estatisticas_pendentes');
    } catch (error) {}
  };

  useEffect(() => {
    let unsubscribePlaylists;
    const unsubscribeAuth = firebase.auth().onAuthStateChanged((user) => {
      setUsuario(user);
      if (user) {
        sincronizarEstatisticas(user.uid);
        const playlistsRef = firebase.database().ref(`users/${user.uid}/playlists`);
        unsubscribePlaylists = playlistsRef.on('value', (snap) => {
          setPlaylistsGlobais(snap.val() || {});
        });
      } else {
        setPlaylistsGlobais({});
      }
      setCarregandoAuth(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribePlaylists) firebase.database().ref().off('value', unsubscribePlaylists);
    };
  }, []);

  if (carregandoAuth || !listaCarregada) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tema.bg }}>
        <ActivityIndicator size="large" color={tema.primaria} />
      </View>
    );
  }

  return (
    <MusicasContext.Provider
      value={{
        musicas,
        setMusicas,
        usuario,
        playlistsGlobais,
        fila,
        indiceFila,
        setIndiceFila,
        musicaAtual,
        tocarAgora,
        tocarLista,
        tocarDeProximo,
        adicionarAoFimDaFila,
        reordenarFila,
        avancarMusica,
        voltarMusica,
        removerDaFila,
        abrirMenuOpcoes,
        resolverMusicaLocal,
        tema,
        temaEscuro,
        alternarTemaEscuro,
        corPrimaria,
        escolherCorPrimaria,
        setModalTemaVisivel,
      }}
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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

      <Modal visible={musicasMenu.length > 0} transparent={true} animationType="fade" onRequestClose={fecharMenuOpcoes}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={fecharMenuOpcoes}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitulo, { color: tema.texto }]} numberOfLines={1}>
              {musicasMenu.length === 1
                ? musicasMenu[0]?.tags?.title || musicasMenu[0]?.title || musicasMenu[0]?.name?.replace('.mp3', '')
                : `${musicasMenu.length} músicas selecionadas`}
            </Text>
            {musicasMenu.length === 1 && (
              <Text style={[styles.modalSubtitulo, { color: tema.subtexto }]} numberOfLines={1}>
                {musicasMenu[0]?.tags?.artist || musicasMenu[0]?.artist || 'Artista Desconhecido'}
              </Text>
            )}

            {!exibirEscolherPlaylist ? (
              <>
                <TouchableOpacity style={[styles.opcaoBotao, { borderBottomColor: tema.borda }]} onPress={() => tocarDeProximo(musicasMenu)}>
                  <MaterialCommunityIcons name="playlist-play" size={24} color={tema.primaria} />
                  <Text style={[styles.opcaoTexto, { color: tema.texto }]}>Tocar de próximo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.opcaoBotao, { borderBottomColor: tema.borda }]} onPress={() => adicionarAoFimDaFila(musicasMenu)}>
                  <MaterialCommunityIcons name="playlist-plus" size={24} color={tema.primaria} />
                  <Text style={[styles.opcaoTexto, { color: tema.texto }]}>Adicionar ao fim da fila</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.opcaoBotao, { borderBottomColor: tema.borda }]} onPress={() => setExibirEscolherPlaylist(true)}>
                  <MaterialCommunityIcons name="folder-music-outline" size={24} color={tema.primaria} />
                  <Text style={[styles.opcaoTexto, { color: tema.texto }]}>Adicionar a uma Playlist</Text>
                </TouchableOpacity>
              </>
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

      <Modal visible={modalTemaVisivel} transparent={true} animationType="fade" onRequestClose={() => setModalTemaVisivel(false)}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setModalTemaVisivel(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitulo, { color: tema.texto, marginBottom: 15 }]}>Aparência do Aplicativo</Text>

            <View style={[styles.linhaSwitch, { borderBottomColor: tema.borda }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="theme-light-dark" size={24} color={tema.primaria} />
                <Text style={[styles.opcaoTexto, { color: tema.texto, marginLeft: 0 }]}>Modo Escuro</Text>
              </View>
              <Switch
                value={temaEscuro}
                onValueChange={alternarTemaEscuro}
                trackColor={{ false: '#999', true: tema.primaria }}
              />
            </View>

            <Text style={[styles.escolherTitulo, { color: tema.subtexto, marginTop: 15 }]}>Paleta de Cores:</Text>
            <View style={styles.gradeCores}>
              {PALETAS_CORES.map((p) => (
                <TouchableOpacity
                  key={p.cor}
                  style={[
                    styles.bolinhaCor,
                    { backgroundColor: p.cor },
                    corPrimaria === p.cor && styles.bolinhaSelecionada,
                  ]}
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
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '90%', borderRadius: 16, padding: 20, elevation: 6 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  modalSubtitulo: { fontSize: 14, textAlign: 'center', marginBottom: 12, marginTop: 4 },
  escolherTitulo: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  opcaoBotao: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  opcaoTexto: { fontSize: 16, marginLeft: 15, fontWeight: '500' },
  linhaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  gradeCores: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8, gap: 12 },
  bolinhaCor: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  bolinhaSelecionada: { borderWidth: 3, borderColor: '#FFF' },
});