import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, Modal, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MusicasContext } from '../App';
import firebase from '../config/config';

export const CAPAS_PRE_SELECIONADAS = [
  { id: 'preset_nyx', nome: 'Mascote Nyx', source: require('../assets/mascote.png') },
  { id: 'asset_icon', nome: 'Logo App', source: require('../assets/icon.png') },
  { id: 'preset_rock', nome: 'Rock / Metal', icone: 'guitar-electric', cor: '#B71C1C' },
  { id: 'preset_hiphop', nome: 'Hip-Hop / Trap', icone: 'microphone-variant', cor: '#1A237E' },
  { id: 'preset_treino', nome: 'Treino / Gym', icone: 'dumbbell', cor: '#E65100' },
  { id: 'preset_chill', nome: 'Chill / Lo-Fi', icone: 'coffee', cor: '#004D40' },
];

// Exibe a capa da playlist por prioridade: foto da galeria -> preset -> capa da 1ª música local -> ícone padrão
export function RenderizarCapaPlaylist({ capaInfo, musicasDaPlaylist, musicasLocais, tamanho = 54, tema }) {
  const estiloImg = { width: tamanho, height: tamanho, borderRadius: 10 };

  if (capaInfo?.tipo === 'galeria' && capaInfo.uri) {
    return <Image source={{ uri: capaInfo.uri }} style={estiloImg} />;
  }

  if (capaInfo?.tipo === 'preset') {
    const preset = CAPAS_PRE_SELECIONADAS.find((p) => p.id === capaInfo.id);
    if (preset?.source) return <Image source={preset.source} style={estiloImg} />;
    if (preset) {
      return (
        <View style={[estiloImg, styles.caixaCentralizada, { backgroundColor: preset.cor }]}>
          <MaterialCommunityIcons name={preset.icone} size={tamanho * 0.55} color="#FFF" />
        </View>
      );
    }
  }

  if (musicasDaPlaylist && musicasLocais) {
    for (const item of Object.values(musicasDaPlaylist)) {
      const local = musicasLocais.find((m) => m.uri === item.uri || m.tags?.title === item.title);
      if (local?.tags?.artwork) return <Image source={{ uri: local.tags.artwork }} style={estiloImg} />;
    }
  }

  return (
    <View style={[estiloImg, styles.caixaCentralizada, { backgroundColor: tema.primariaClara }]}>
      <MaterialCommunityIcons name="playlist-music" size={tamanho * 0.55} color={tema.primaria} />
    </View>
  );
}

// Modal reutilizável para escolher capa na criação e na edição da playlist
export function ModalEscolherCapa({ visivel, aoFechar, aoEscolherCapa, tema, titulo = 'Capa da Playlist' }) {
  const escolherDaGaleria = async () => {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para definir a capa.');
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets?.[0]) {
        const asset = resultado.assets[0];
        // Salva em Base64 comprimido para sincronizar a capa da playlist no Firebase
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        aoEscolherCapa({ tipo: 'galeria', uri });
        aoFechar();
      }
    } catch (e) {}
  };

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={aoFechar}>
      <TouchableOpacity style={styles.modalFundo} activeOpacity={1} onPress={aoFechar}>
        <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: tema.card }]}>
          <Text style={[styles.modalTitulo, { color: tema.texto }]}>{titulo}</Text>

          <TouchableOpacity style={[styles.botaoGaleria, { backgroundColor: tema.primaria }]} onPress={escolherDaGaleria}>
            <MaterialCommunityIcons name="image-multiple" size={22} color="#FFF" />
            <Text style={styles.textoGaleria}>Escolher da Galeria</Text>
          </TouchableOpacity>

          <Text style={[styles.subtituloModal, { color: tema.subtexto }]}>Ou escolha uma capa pré-selecionada:</Text>
          <View style={styles.gradePresets}>
            {CAPAS_PRE_SELECIONADAS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.itemPreset}
                onPress={() => {
                  aoEscolherCapa({ tipo: 'preset', id: p.id });
                  aoFechar();
                }}
              >
                {p.source ? (
                  <Image source={p.source} style={styles.imgPreset} />
                ) : (
                  <View style={[styles.imgPreset, styles.caixaCentralizada, { backgroundColor: p.cor }]}>
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
  );
}

export default function Playlists({ navigation }) {
  const { usuario, playlistsGlobais, musicas, tema } = useContext(MusicasContext);
  const [novaPlaylist, setNovaPlaylist] = useState('');
  const [capaEscolhida, setCapaEscolhida] = useState(null);
  const [modalCapaVisivel, setModalCapaVisivel] = useState(false);

  const criarPlaylist = async () => {
    // Remove caracteres proibidos em chaves do Firebase Realtime Database
    const nome = novaPlaylist.trim().replace(/[.#$\[\]\/]/g, '');
    if (!nome || !usuario) return;

    try {
      await firebase.database().ref(`users/${usuario.uid}/playlists/${nome}`).set({
        criadaEm: Date.now(),
        capa: capaEscolhida || null,
      });
      setNovaPlaylist('');
      setCapaEscolhida(null);
    } catch (e) {}
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <View style={styles.tituloTopo}>
        <Image source={require('../assets/mascote.png')} style={styles.mascoteIcone} />
        <Text style={[styles.titulo, { color: tema.primaria }]}>Minhas Playlists</Text>
      </View>

      <View style={styles.criarContainer}>
        <TouchableOpacity
          style={[styles.botaoCapaCriar, { backgroundColor: tema.card, borderColor: tema.primaria }]}
          onPress={() => setModalCapaVisivel(true)}
        >
          {capaEscolhida ? (
            <RenderizarCapaPlaylist capaInfo={capaEscolhida} tamanho={48} tema={tema} />
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
        data={Object.keys(playlistsGlobais)}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const dadosPl = playlistsGlobais[item];
          const quantidade = dadosPl?.musicas ? Object.keys(dadosPl.musicas).length : 0;
          return (
            <TouchableOpacity
              style={[styles.itemPlaylist, { backgroundColor: tema.card }]}
              onPress={() => navigation.navigate('TelaPlaylist', { nomePlaylist: item })}
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

      <ModalEscolherCapa
        visivel={modalCapaVisivel}
        aoFechar={() => setModalCapaVisivel(false)}
        aoEscolherCapa={setCapaEscolhida}
        tema={tema}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 45 },
  caixaCentralizada: { justifyContent: 'center', alignItems: 'center' },
  tituloTopo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
  mascoteIcone: { width: 30, height: 30 },
  titulo: { fontSize: 24, fontWeight: 'bold' },
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
  textoGaleria: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  subtituloModal: { fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  gradePresets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  itemPreset: { alignItems: 'center', width: '30%', marginBottom: 10 },
  imgPreset: { width: 64, height: 64, borderRadius: 12 },
});
