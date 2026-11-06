import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MusicasContext } from '../App';
import firebase from '../config/config';

export const CAPAS_PRE_SELECIONADAS = [
  { id: 'asset_icon', nome: 'Logo App', source: require('../assets/icon.png') },
  { id: 'preset_rock', nome: 'Rock / Metal', icone: 'guitar-electric', cor: '#B71C1C' },
  { id: 'preset_hiphop', nome: 'Hip-Hop / Trap', icone: 'microphone-variant', cor: '#1A237E' },
  { id: 'preset_treino', nome: 'Treino / Gym', icone: 'dumbbell', cor: '#E65100' },
  { id: 'preset_chill', nome: 'Chill / Lo-Fi', icone: 'coffee', cor: '#004D40' },
];

export function RenderizarCapaPlaylist({ capaInfo, musicasDaPlaylist, musicasLocais, tamanho = 54, tema }) {
  if (capaInfo?.tipo === 'galeria' && capaInfo.uri) {
    return <Image source={{ uri: capaInfo.uri }} style={{ width: tamanho, height: tamanho, borderRadius: 10 }} />;
  }
  if (capaInfo?.tipo === 'preset') {
    const preset = CAPAS_PRE_SELECIONADAS.find((p) => p.id === capaInfo.id);
    if (preset?.source) {
      return <Image source={preset.source} style={{ width: tamanho, height: tamanho, borderRadius: 10 }} />;
    }
    if (preset) {
      return (
        <View style={{ width: tamanho, height: tamanho, borderRadius: 10, backgroundColor: preset.cor, justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name={preset.icone} size={tamanho * 0.55} color="#FFF" />
        </View>
      );
    }
  }

  if (musicasDaPlaylist && musicasLocais) {
    const arrayM = Object.values(musicasDaPlaylist);
    for (const item of arrayM) {
      const local = musicasLocais.find((m) => m.uri === item.uri || m.tags?.title === item.title);
      if (local?.tags?.artwork) {
        return <Image source={{ uri: local.tags.artwork }} style={{ width: tamanho, height: tamanho, borderRadius: 10 }} />;
      }
    }
  }

  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: 10, backgroundColor: tema.primariaClara, justifyContent: 'center', alignItems: 'center' }}>
      <MaterialCommunityIcons name="playlist-music" size={tamanho * 0.55} color={tema.primaria} />
    </View>
  );
}

export default function Playlists({ navigation }) {
  const { usuario, playlistsGlobais, musicas, tema } = useContext(MusicasContext);
  const [novaPlaylist, setNovaPlaylist] = useState('');
  const [capaEscolhida, setCapaEscolhida] = useState(null);
  const [modalCapaVisivel, setModalCapaVisivel] = useState(false);

  const escolherDaGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para definir a capa.');
      return;
    }

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
      setCapaEscolhida({ tipo: 'galeria', uri: base64Uri });
      setModalCapaVisivel(false);
    }
  };

  const criarPlaylist = () => {
    const nome = novaPlaylist.trim().replace(/[.#$\[\]\/]/g, '');
    if (nome === '' || !usuario) return;

    firebase.database().ref(`users/${usuario.uid}/playlists/${nome}`).set({
      criadaEm: Date.now(),
      capa: capaEscolhida || null,
    });
    setNovaPlaylist('');
    setCapaEscolhida(null);
  };

  const abrirPlaylist = (nome) => {
    navigation.navigate('TelaPlaylist', { nomePlaylist: nome });
  };

  const listasDePlaylists = Object.keys(playlistsGlobais);

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <Text style={[styles.titulo, { color: tema.primaria }]}>Minhas Playlists</Text>

      <View style={styles.criarContainer}>
        <TouchableOpacity
          style={[styles.botaoCapaCriar, { backgroundColor: tema.card, borderColor: tema.primaria }]}
          onPress={() => setModalCapaVisivel(true)}
        >
          {capaEscolhida?.uri ? (
            <Image source={{ uri: capaEscolhida.uri }} style={{ width: 48, height: 48, borderRadius: 9 }} />
          ) : (
            <MaterialCommunityIcons name="image-plus" size={24} color={tema.primaria} />
          )}
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { backgroundColor: tema.card, color: tema.texto }]}
          placeholder="Nome da nova playlist..."
          placeholderTextColor={tema.subtexto}
          value={novaPlaylist}
          onChangeText={setNovaPlaylist}
        />

        <TouchableOpacity style={[styles.botaoCriar, { backgroundColor: tema.primaria }]} onPress={criarPlaylist}>
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listasDePlaylists}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const dadosPl = playlistsGlobais[item];
          const quantidade = dadosPl?.musicas ? Object.keys(dadosPl.musicas).length : 0;
          return (
            <TouchableOpacity
              style={[styles.itemPlaylist, { backgroundColor: tema.card }]}
              onPress={() => abrirPlaylist(item)}
            >
              <RenderizarCapaPlaylist
                capaInfo={dadosPl?.capa}
                musicasDaPlaylist={dadosPl?.musicas}
                musicasLocais={musicas}
                tamanho={54}
                tema={tema}
              />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.nomePlaylist, { color: tema.texto }]}>{item}</Text>
                <Text style={[styles.quantidadeText, { color: tema.subtexto }]}>{quantidade} música(s)</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={tema.subtexto} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.vazioText, { color: tema.subtexto }]}>
            Nenhuma playlist criada. Crie a primeira acima!
          </Text>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />

      <Modal visible={modalCapaVisivel} transparent={true} animationType="fade" onRequestClose={() => setModalCapaVisivel(false)}>
        <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={() => setModalCapaVisivel(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
            <Text style={[styles.modalTitulo, { color: tema.texto }]}>Capa da Playlist</Text>

            <TouchableOpacity style={[styles.botaoGaleria, { backgroundColor: tema.primaria }]} onPress={escolherDaGaleria}>
              <MaterialCommunityIcons name="image-multiple" size={22} color="#FFF" />
              <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 8 }}>Escolher da Galeria</Text>
            </TouchableOpacity>

            <Text style={[styles.subtituloModal, { color: tema.subtexto }]}>Ou escolha uma capa pré-selecionada:</Text>
            <View style={styles.gradePresets}>
              {CAPAS_PRE_SELECIONADAS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.itemPreset}
                  onPress={() => {
                    setCapaEscolhida({ tipo: 'preset', id: p.id });
                    setModalCapaVisivel(false);
                  }}
                >
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
  container: { flex: 1, paddingTop: 45 },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  criarContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20, gap: 8 },
  botaoCapaCriar: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 2, overflow: 'hidden' },
  input: { flex: 1, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, elevation: 2 },
  botaoCriar: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  itemPlaylist: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 2 },
  nomePlaylist: { fontSize: 17, fontWeight: 'bold' },
  quantidadeText: { fontSize: 13, marginTop: 3 },
  vazioText: { textAlign: 'center', marginTop: 20, fontSize: 15 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '90%', borderRadius: 15, padding: 20 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  botaoGaleria: { flexDirection: 'row', padding: 14, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  subtituloModal: { fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  gradePresets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  itemPreset: { alignItems: 'center', width: '30%', marginBottom: 10 },
  imgPreset: { width: 64, height: 64, borderRadius: 12 },
});