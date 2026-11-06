import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { MusicasContext } from '../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import firebase from '../config/config';
import { CAPAS_PRE_SELECIONADAS, RenderizarCapaPlaylist } from './Playlists';

export const formatarTempo = (segundos) => {
  if (!segundos) return '00:00';
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg < 10 ? '0' : ''}${seg}`;
};

export default function TelaPlaylist({ route, navigation }) {
  const [nomeAtual, setNomeAtual] = useState(route.params.nomePlaylist);
  const {
    usuario,
    playlistsGlobais,
    musicas,
    tocarAgora,
    tocarLista,
    abrirMenuOpcoes,
    resolverMusicaLocal,
    tema,
  } = useContext(MusicasContext);

  const [menu3PontosVisivel, setMenu3PontosVisivel] = useState(false);
  const [modalRenomearVisivel, setModalRenomearVisivel] = useState(false);
  const [modalCapaVisivel, setModalCapaVisivel] = useState(false);
  const [novoNomeInput, setNovoNomeInput] = useState(nomeAtual);

  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);

  const dadosPlaylist = playlistsGlobais[nomeAtual] || {};
  const musicasFirebase = dadosPlaylist.musicas || {};
  const entradasMusicas = Object.entries(musicasFirebase);

  const listaProcessada = entradasMusicas.map(([firebaseKey, itemFb]) => {
    const musicaLocal = resolverMusicaLocal(itemFb);
    return {
      firebaseKey,
      ...(musicaLocal || itemFb),
      indisponivel: !musicaLocal,
    };
  });

  const tocarMusica = (item) => {
    if (modoSelecao) {
      if (!item.indisponivel) {
        setSelecionadas((antigas) =>
          antigas.includes(item.firebaseKey) ? antigas.filter((k) => k !== item.firebaseKey) : [...antigas, item.firebaseKey]
        );
      }
      return;
    }

    if (item.indisponivel) {
      Alert.alert('Música Indisponível', 'Este arquivo de áudio não foi encontrado no armazenamento deste dispositivo.');
      return;
    }
    const apenasDisponiveis = listaProcessada.filter((m) => !m.indisponivel);
    tocarAgora(item, apenasDisponiveis);
    navigation.navigate('Reproduzir');
  };

  const selecionarTudoNaPlaylist = () => {
    const disponiveisKeys = listaProcessada.filter((m) => !m.indisponivel).map((m) => m.firebaseKey);
    if (selecionadas.length === disponiveisKeys.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(disponiveisKeys);
    }
  };

  const removerMusicaUnica = (firebaseKey) => {
    if (!usuario) return;
    firebase.database().ref(`users/${usuario.uid}/playlists/${nomeAtual}/musicas/${firebaseKey}`).remove();
  };

  const apagarSelecionadasEmLote = () => {
    if (!usuario || selecionadas.length === 0) return;
    Alert.alert(
      'Remover da Playlist',
      `Deseja remover as ${selecionadas.length} músicas selecionadas desta playlist?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const updates = {};
            selecionadas.forEach((key) => {
              updates[`users/${usuario.uid}/playlists/${nomeAtual}/musicas/${key}`] = null;
            });
            firebase.database().ref().update(updates);
            setModoSelecao(false);
            setSelecionadas([]);
          },
        },
      ]
    );
  };

  const confirmarRenomear = async () => {
    const limpo = novoNomeInput.trim().replace(/[.#$\[\]\/]/g, '');
    if (!limpo || limpo === nomeAtual || !usuario) {
      setModalRenomearVisivel(false);
      return;
    }
    try {
      const refAntiga = firebase.database().ref(`users/${usuario.uid}/playlists/${nomeAtual}`);
      const snap = await refAntiga.once('value');
      const dados = snap.val();
      if (dados) {
        await firebase.database().ref(`users/${usuario.uid}/playlists/${limpo}`).set(dados);
        await refAntiga.remove();
        setNomeAtual(limpo);
      }
    } catch (e) {}
    setModalRenomearVisivel(false);
  };

  const apagarPlaylistInteira = () => {
    setMenu3PontosVisivel(false);
    if (!usuario) return;
    firebase.database().ref(`users/${usuario.uid}/playlists/${nomeAtual}`).remove();
    navigation.goBack();
  };

  const alterarCapaGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!resultado.canceled && resultado.assets?.[0]) {
      const asset = resultado.assets[0];
      const base64Uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      firebase
        .database()
        .ref(`users/${usuario.uid}/playlists/${nomeAtual}/capa`)
        .set({ tipo: 'galeria', uri: base64Uri });
      setModalCapaVisivel(false);
    }
  };

  const alterarCapaPreset = (idPreset) => {
    firebase
      .database()
      .ref(`users/${usuario.uid}/playlists/${nomeAtual}/capa`)
      .set({ tipo: 'preset', id: idPreset });
    setModalCapaVisivel(false);
  };

  const renderizarItem = ({ item }) => {
    const capaUri = item.tags?.artwork || null;
    const titulo = item.tags?.title || item.title || item.name?.replace('.mp3', '');
    const artista = item.tags?.artist || item.artist || 'Artista Desconhecido';
    const duracao = item.tags?.duration || item.duration || 0;
    const estaSelecionada = selecionadas.includes(item.firebaseKey);

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { backgroundColor: tema.card },
          item.indisponivel && { opacity: 0.55 },
          estaSelecionada && { borderColor: tema.primaria, borderWidth: 2 },
        ]}
        onPress={() => tocarMusica(item)}
        onLongPress={() => {
          if (!item.indisponivel && !modoSelecao) abrirMenuOpcoes(item);
        }}
        delayLongPress={300}
      >
        {modoSelecao && !item.indisponivel && (
          <MaterialCommunityIcons
            name={estaSelecionada ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={tema.primaria}
            style={{ marginRight: 10 }}
          />
        )}

        {capaUri ? (
          <Image source={{ uri: capaUri }} style={styles.capaMusica} />
        ) : (
          <View style={[styles.capaMusica, { backgroundColor: tema.primariaClara, justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons
              name={item.indisponivel ? 'alert-circle-outline' : 'music'}
              size={24}
              color={item.indisponivel ? '#FF6B6B' : tema.primaria}
            />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={[styles.nomeMusica, { color: tema.texto }]} numberOfLines={1}>
            {titulo}
          </Text>
          <Text
            style={[
              styles.nomeArtista,
              { color: item.indisponivel ? '#FF6B6B' : tema.subtexto },
            ]}
            numberOfLines={1}
          >
            {item.indisponivel ? 'Música Indisponível neste dispositivo' : artista}
          </Text>
        </View>

        <View style={styles.duracaoContainer}>
          <Text style={[styles.textoTempo, { color: tema.subtexto }]}>{formatarTempo(duracao)}</Text>
          {!modoSelecao && (
            <TouchableOpacity onPress={() => removerMusicaUnica(item.firebaseKey)} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const disponiveisCount = listaProcessada.filter((m) => !m.indisponivel).length;

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <View style={[styles.header, { backgroundColor: tema.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={tema.texto} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMenu3PontosVisivel(true)} style={styles.botao3Pontos}>
          <MaterialCommunityIcons name="dots-vertical" size={28} color={tema.texto} />
        </TouchableOpacity>

        <RenderizarCapaPlaylist
          capaInfo={dadosPlaylist.capa}
          musicasDaPlaylist={musicasFirebase}
          musicasLocais={musicas}
          tamanho={120}
          tema={tema}
        />

        <Text style={[styles.tituloHeader, { color: tema.texto }]}>{nomeAtual}</Text>
        <Text style={[styles.quantidade, { color: tema.subtexto }]}>
          {listaProcessada.length} música(s)
        </Text>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          {disponiveisCount > 0 && (
            <>
              <TouchableOpacity
                style={[styles.botaoAcaoHeader, { backgroundColor: tema.primaria }]}
                onPress={() => {
                  tocarLista(listaProcessada, false);
                  navigation.navigate('Reproduzir');
                }}
              >
                <MaterialCommunityIcons name="play" size={20} color="#FFF" />
                <Text style={styles.textoBotaoHeader}>Tocar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botaoAcaoHeader, { backgroundColor: tema.primariaClara }]}
                onPress={() => {
                  tocarLista(listaProcessada, true);
                  navigation.navigate('Reproduzir');
                }}
              >
                <MaterialCommunityIcons name="shuffle-variant" size={20} color={tema.primaria} />
                <Text style={[styles.textoBotaoHeader, { color: tema.primaria }]}>Aleatório</Text>
              </TouchableOpacity>
            </>
          )}

          {disponiveisCount > 0 && (
            <TouchableOpacity
              style={[styles.botaoAcaoHeader, { backgroundColor: modoSelecao ? tema.primaria : tema.card, borderWidth: 1, borderColor: tema.primaria }]}
              onPress={() => {
                if (modoSelecao) {
                  setModoSelecao(false);
                  setSelecionadas([]);
                } else {
                  setModoSelecao(true);
                }
              }}
            >
              <MaterialCommunityIcons name="checkbox-multiple-marked-outline" size={18} color={modoSelecao ? '#FFF' : tema.primaria} />
              <Text style={[styles.textoBotaoHeader, { color: modoSelecao ? '#FFF' : tema.primaria }]}>
                {modoSelecao ? 'Cancelar' : 'Selecionar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={listaProcessada}
        keyExtractor={(item) => item.firebaseKey}
        renderItem={renderizarItem}
        ListEmptyComponent={
          <Text style={[styles.vazioText, { color: tema.subtexto }]}>
            Esta playlist ainda não tem músicas.
          </Text>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: modoSelecao ? 90 : 20 }}
      />

      {modoSelecao && (
        <View style={[styles.barraMultiSelecao, { backgroundColor: tema.card, borderTopColor: tema.borda }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.contadorSelecao, { color: tema.texto }]}>
              {selecionadas.length} de {disponiveisCount} selecionada(s)
            </Text>
            <TouchableOpacity onPress={selecionarTudoNaPlaylist}>
              <Text style={{ color: tema.primaria, fontWeight: 'bold' }}>
                {selecionadas.length === disponiveisCount ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.botaoApagarLote, { backgroundColor: '#FF6B6B' }]}
            onPress={apagarSelecionadasEmLote}
            disabled={selecionadas.length === 0}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 6 }}>Remover Selecionadas da Playlist</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL 3 PONTOS */}
      <Modal visible={menu3PontosVisivel} transparent={true} animationType="fade" onRequestClose={() => setMenu3PontosVisivel(false)}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setMenu3PontosVisivel(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitulo, { color: tema.texto }]}>Opções de "{nomeAtual}"</Text>

            <TouchableOpacity
              style={[styles.opcaoItem, { borderBottomColor: tema.borda }]}
              onPress={() => {
                setMenu3PontosVisivel(false);
                setNovoNomeInput(nomeAtual);
                setModalRenomearVisivel(true);
              }}
            >
              <MaterialCommunityIcons name="pencil-outline" size={24} color={tema.primaria} />
              <Text style={[styles.opcaoTexto, { color: tema.texto }]}>Renomear Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.opcaoItem, { borderBottomColor: tema.borda }]}
              onPress={() => {
                setMenu3PontosVisivel(false);
                setModalCapaVisivel(true);
              }}
            >
              <MaterialCommunityIcons name="image-edit-outline" size={24} color={tema.primaria} />
              <Text style={[styles.opcaoTexto, { color: tema.texto }]}>Alterar Imagem da Capa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.opcaoItem, { borderBottomColor: tema.borda }]} onPress={apagarPlaylistInteira}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.opcaoTexto, { color: '#FF6B6B' }]}>Apagar Playlist</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL RENOMEAR */}
      <Modal visible={modalRenomearVisivel} transparent={true} animationType="fade" onRequestClose={() => setModalRenomearVisivel(false)}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setModalRenomearVisivel(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitulo, { color: tema.texto }]}>Renomear Playlist</Text>
            <TextInput
              style={[styles.inputRenomear, { color: tema.texto, borderColor: tema.primaria }]}
              value={novoNomeInput}
              onChangeText={setNovoNomeInput}
              autoFocus
            />
            <TouchableOpacity style={[styles.botaoSalvarNome, { backgroundColor: tema.primaria }]} onPress={confirmarRenomear}>
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Salvar Novo Nome</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL ALTERAR CAPA */}
      <Modal visible={modalCapaVisivel} transparent={true} animationType="fade" onRequestClose={() => setModalCapaVisivel(false)}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setModalCapaVisivel(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitulo, { color: tema.texto }]}>Alterar Capa</Text>
            <TouchableOpacity style={[styles.botaoSalvarNome, { backgroundColor: tema.primaria, marginBottom: 15 }]} onPress={alterarCapaGaleria}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Escolher da Galeria</Text>
            </TouchableOpacity>
            <View style={styles.gradePresets}>
              {CAPAS_PRE_SELECIONADAS.map((p) => (
                <TouchableOpacity key={p.id} style={styles.itemPreset} onPress={() => alterarCapaPreset(p.id)}>
                  {p.source ? (
                    <Image source={p.source} style={styles.imgPreset} />
                  ) : (
                    <View style={[styles.imgPreset, { backgroundColor: p.cor, justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name={p.icone} size={28} color="#FFF" />
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: tema.texto, marginTop: 4 }}>{p.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 45, paddingBottom: 15, elevation: 3, marginBottom: 15, position: 'relative' },
  botaoVoltar: { position: 'absolute', top: 45, left: 20, zIndex: 10, padding: 5 },
  botao3Pontos: { position: 'absolute', top: 45, right: 20, zIndex: 10, padding: 5 },
  tituloHeader: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 10, marginTop: 10 },
  quantidade: { fontSize: 13, marginTop: 2 },
  botoesPlayHeader: { flexDirection: 'row', gap: 10, marginTop: 12 },
  botaoAcaoHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, gap: 4, elevation: 2 },
  textoBotaoHeader: { fontWeight: 'bold', fontSize: 13 },
  itemContainer: { flexDirection: 'row', padding: 10, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 2 },
  capaMusica: { width: 50, height: 50, borderRadius: 8, marginRight: 14 },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 15, fontWeight: 'bold' },
  nomeArtista: { fontSize: 13, marginTop: 3 },
  duracaoContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  textoTempo: { fontSize: 12, fontWeight: 'bold' },
  vazioText: { textAlign: 'center', marginTop: 20, fontSize: 15 },
  barraMultiSelecao: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, borderTopWidth: 1, elevation: 10 },
  contadorSelecao: { fontSize: 13, fontWeight: 'bold' },
  botaoApagarLote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '90%', borderRadius: 15, padding: 20 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  opcaoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  opcaoTexto: { fontSize: 16, fontWeight: '500' },
  inputRenomear: { borderWidth: 1.5, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 15 },
  botaoSalvarNome: { padding: 14, borderRadius: 10, alignItems: 'center' },
  gradePresets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  itemPreset: { alignItems: 'center', width: '30%', marginBottom: 10 },
  imgPreset: { width: 60, height: 60, borderRadius: 12 },
});