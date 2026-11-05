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
import { View, Text, ActivityIndicator, Modal, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  return (
    <NavegacaoTabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Reproduzir') {
            return <Ionicons name="play" size={size} color={color} />;
          } else if (route.name === 'Playlists') {
            return <MaterialCommunityIcons name="playlist-plus" size={size} color={color} />;
          } else if (route.name === 'Listar') {
            return <Ionicons name="list" size={size} color={color} />;
          } else if (route.name === 'Buscar') {
            return <Ionicons name="search" size={size} color={color} />;
          } else if (route.name === 'Conquistas') {
            return <Ionicons name="medal" size={size} color={color} />;
          }
        },
      })}
    >
      <NavegacaoTabs.Screen name="Reproduzir" component={ReproduzirItens} />
      <NavegacaoTabs.Screen name="Playlists" component={PlaylistsNavegacao} />
      <NavegacaoTabs.Screen name="Buscar" component={BuscarNavegacao} />
      <NavegacaoTabs.Screen name="Listar" component={ListarItens} />
      <NavegacaoTabs.Screen name="Conquistas" component={Conquistas} />
    </NavegacaoTabs.Navigator>
  );
}

export default function App() {
  const [musicas, setMusicas] = useState([]);
  const [listaCarregada, setListaCarregada] = useState(false);
  const [playlistsGlobais, setPlaylistsGlobais] = useState({});
  const [usuario, setUsuario] = useState(null);
  const [carregandoAuth, setCarregandoAuth] = useState(true);

  const [fila, setFila] = useState([]);
  const [indiceFila, setIndiceFila] = useState(-1);

  const [musicaMenu, setMusicaMenu] = useState(null);
  const [exibirEscolherPlaylist, setExibirEscolherPlaylist] = useState(false);

  const musicaAtual = indiceFila >= 0 && indiceFila < fila.length ? fila[indiceFila] : null;

  useEffect(() => {
    async function carregarMusicasSalvas() {
      try {
        const musicasSalvas = await AsyncStorage.getItem('biblioteca_musicas_local');
        if (musicasSalvas) {
          setMusicas(JSON.parse(musicasSalvas));
        }
      } catch (e) {
        console.warn('Erro ao carregar músicas salvas:', e);
      } finally {
        setListaCarregada(true);
      }
    }
    carregarMusicasSalvas();
  }, []);

  useEffect(() => {
    if (!listaCarregada) return;

    async function salvarMusicasLocalmente() {
      try {
        const listaLeve = musicas.map(m => ({
          uri: m.uri,
          name: m.name,
          tags: {
            title: m.tags?.title,
            artist: m.tags?.artist,
            album: m.tags?.album,
            duration: m.tags?.duration,
            artwork: null
          }
        }));
        await AsyncStorage.setItem('biblioteca_musicas_local', JSON.stringify(listaLeve));
      } catch (e) {
        console.warn('Erro ao salvar lista de músicas:', e);
      }
    }
    salvarMusicasLocalmente();
  }, [musicas, listaCarregada]);

  const tocarAgora = (item, novaLista = null) => {
    const musicaFormatada = {
      uri: item.uri,
      name: item.name || item.title || item.filename || 'Música',
      tags: item.tags || {
        title: item.title || item.name?.replace('.mp3', ''),
        artist: item.artist || 'Artista Desconhecido',
        album: item.album || 'Sem Álbum',
        artwork: item.artwork || null,
        duration: item.duration || 0,
      }
    };

    if (novaLista && Array.isArray(novaLista)) {
      const filaFormatada = novaLista.map(m => ({
        uri: m.uri,
        name: m.name || m.title || m.filename || 'Música',
        tags: m.tags || {
          title: m.title || m.name?.replace('.mp3', ''),
          artist: m.artist || 'Artista Desconhecido',
          album: m.album || 'Sem Álbum',
          artwork: m.artwork || null,
          duration: m.duration || 0,
        }
      }));
      setFila(filaFormatada);
      const idx = filaFormatada.findIndex(m => m.uri === musicaFormatada.uri);
      setIndiceFila(idx !== -1 ? idx : 0);
    } else {
      setFila((filaAntiga) => {
        const idxExistente = filaAntiga.findIndex(m => m.uri === musicaFormatada.uri);
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

  const tocarDeProximo = (item) => {
    const musicaFormatada = {
      uri: item.uri,
      name: item.name || item.title || 'Música',
      tags: item.tags || { title: item.title || item.name?.replace('.mp3', ''), artist: item.artist || 'Artista Desconhecido', duration: item.duration || 0 }
    };
    setFila((filaAntiga) => {
      if (filaAntiga.length === 0) {
        setIndiceFila(0);
        return [musicaFormatada];
      }
      const nova = [...filaAntiga];
      nova.splice(indiceFila + 1, 0, musicaFormatada);
      return nova;
    });
    fecharMenuOpcoes();
  };

  const adicionarAoFimDaFila = (item) => {
    const musicaFormatada = {
      uri: item.uri,
      name: item.name || item.title || 'Música',
      tags: item.tags || { title: item.title || item.name?.replace('.mp3', ''), artist: item.artist || 'Artista Desconhecido', duration: item.duration || 0 }
    };
    setFila((filaAntiga) => {
      if (filaAntiga.length === 0) setIndiceFila(0);
      return [...filaAntiga, musicaFormatada];
    });
    fecharMenuOpcoes();
  };

  const avancarMusica = () => {
    if (indiceFila < fila.length - 1) setIndiceFila(indiceFila + 1);
  };

  const voltarMusica = () => {
    if (indiceFila > 0) setIndiceFila(indiceFila - 1);
  };

  const removerDaFila = (indexParaRemover) => {
    setFila((filaAntiga) => {
      const nova = filaAntiga.filter((_, idx) => idx !== indexParaRemover);
      if (indexParaRemover < indiceFila) {
        setIndiceFila(indiceFila - 1);
      } else if (indexParaRemover === indiceFila && indiceFila >= nova.length) {
        setIndiceFila(nova.length - 1);
      }
      return nova;
    });
  };

  const abrirMenuOpcoes = (item) => {
    setMusicaMenu(item);
    setExibirEscolherPlaylist(false);
  };

  const fecharMenuOpcoes = () => {
    setMusicaMenu(null);
    setExibirEscolherPlaylist(false);
  };

  const salvarMusicaNaPlaylist = (nomePlaylist) => {
    if (!musicaMenu || !usuario) return;
    const novaMusica = {
      uri: musicaMenu.uri,
      title: musicaMenu.tags?.title || musicaMenu.title || musicaMenu.name?.replace('.mp3', ''),
      artist: musicaMenu.tags?.artist || musicaMenu.artist || 'Artista Desconhecido',
      duration: musicaMenu.tags?.duration || musicaMenu.duration || 0
    };
    firebase.database().ref(`users/${usuario.uid}/playlists/${nomePlaylist}/musicas`).push(novaMusica);
    fecharMenuOpcoes();
  };

  const sincronizarEstatisticas = async (uid) => {
    try {
      const statsGuardados = await AsyncStorage.getItem('estatisticas_pendentes');
      if (!statsGuardados) return;
      const arrayStats = JSON.parse(statsGuardados);
      if (arrayStats.length === 0) return;

      const agregacao = { artistas: {}, albuns: {}, musicas: {}, tempoMensal: {} };

      arrayStats.forEach(stat => {
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
      Object.keys(agregacao.artistas).forEach(artista => {
        updates[`artistas/${artista}/reproducoes`] = firebase.database.ServerValue.increment(agregacao.artistas[artista].reprod);
        updates[`artistas/${artista}/segundosTotais`] = firebase.database.ServerValue.increment(agregacao.artistas[artista].segs);
      });
      Object.keys(agregacao.albuns).forEach(album => {
        updates[`albuns/${album}/reproducoes`] = firebase.database.ServerValue.increment(agregacao.albuns[album].reprod);
      });
      Object.keys(agregacao.musicas).forEach(chave => {
        updates[`musicas/${chave}/reproducoes`] = firebase.database.ServerValue.increment(agregacao.musicas[chave].reprod);
        updates[`musicas/${chave}/titulo`] = agregacao.musicas[chave].titulo;
        updates[`musicas/${chave}/artista`] = agregacao.musicas[chave].artista;
      });
      Object.keys(agregacao.tempoMensal).forEach(mesAno => {
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
        unsubscribePlaylists = playlistsRef.on('value', snap => {
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

  if (carregandoAuth || !listaCarregada) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color="purple" /></View>;

  return (
    <MusicasContext.Provider value={{
      musicas, setMusicas, usuario, playlistsGlobais,
      fila, indiceFila, setIndiceFila, musicaAtual,
      tocarAgora, tocarDeProximo, adicionarAoFimDaFila, avancarMusica, voltarMusica, removerDaFila,
      abrirMenuOpcoes
    }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {usuario ? <Stack.Screen name="MainTabs" component={AppTabs} /> : (
            <>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Cadastro" component={Cadastro} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      <Modal visible={!!musicaMenu} transparent={true} animationType="fade" onRequestClose={fecharMenuOpcoes}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={fecharMenuOpcoes}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitulo} numberOfLines={1}>
              {musicaMenu?.tags?.title || musicaMenu?.title || musicaMenu?.name?.replace('.mp3', '')}
            </Text>
            <Text style={styles.modalSubtitulo} numberOfLines={1}>
              {musicaMenu?.tags?.artist || musicaMenu?.artist || 'Artista Desconhecido'}
            </Text>

            {!exibirEscolherPlaylist ? (
              <>
                <TouchableOpacity style={styles.opcaoBotao} onPress={() => tocarDeProximo(musicaMenu)}>
                  <MaterialCommunityIcons name="playlist-play" size={24} color="purple" />
                  <Text style={styles.opcaoTexto}>Tocar a seguir</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.opcaoBotao} onPress={() => adicionarAoFimDaFila(musicaMenu)}>
                  <MaterialCommunityIcons name="playlist-plus" size={24} color="purple" />
                  <Text style={styles.opcaoTexto}>Adicionar ao fim da fila</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.opcaoBotao} onPress={() => setExibirEscolherPlaylist(true)}>
                  <MaterialCommunityIcons name="folder-music-outline" size={24} color="purple" />
                  <Text style={styles.opcaoTexto}>Adicionar a uma Playlist</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ maxHeight: 250 }}>
                <Text style={styles.escolherTitulo}>Escolha a Playlist:</Text>
                <FlatList
                  data={Object.keys(playlistsGlobais)}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.opcaoBotao} onPress={() => salvarMusicaNaPlaylist(item)}>
                      <MaterialCommunityIcons name="playlist-music" size={24} color="purple" />
                      <Text style={styles.opcaoTexto}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginVertical: 15 }}>Nenhuma playlist criada.</Text>}
                />
              </View>
            )}

            <TouchableOpacity style={styles.botaoCancelar} onPress={fecharMenuOpcoes}>
              <Text style={styles.textoCancelar}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </MusicasContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', width: '90%', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  modalSubtitulo: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 15 },
  escolherTitulo: { fontSize: 15, fontWeight: 'bold', color: 'purple', marginBottom: 10 },
  opcaoBotao: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  opcaoTexto: { fontSize: 16, color: '#333', marginLeft: 15, fontWeight: '500' },
  botaoCancelar: { marginTop: 15, backgroundColor: '#FF6B6B', padding: 12, borderRadius: 10, alignItems: 'center' },
  textoCancelar: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});