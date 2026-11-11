import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import firebase, { MusicasContext, MASCOTE, AnimarEntrada, BannerMascote, exibirAviso, vibrar } from '../config/config';

export const CAPAS_PRE_SELECIONADAS = [
  { id: 'asset_icon', nome: 'Nyx Oficial', source: MASCOTE.atento },
  { id: 'preset_nyx_fones', nome: 'Nyx Fones', source: MASCOTE.fones },
  { id: 'preset_nyx_carinho', nome: 'Nyx Coração', source: MASCOTE.carinho },
  { id: 'preset_nyx_som', nome: 'Nyx Som', source: MASCOTE.som },
  { id: 'preset_nyx_voando', nome: 'Nyx Voando', source: MASCOTE.voando },
  { id: 'preset_nyx_play', nome: 'Nyx Play', source: MASCOTE.play },
  { id: 'preset_rock', nome: 'Rock / Metal', icone: 'guitar-electric', cor: '#E53935' },
  { id: 'preset_hiphop', nome: 'Hip-Hop / Trap', icone: 'microphone-variant', cor: '#3949AB' },
  { id: 'preset_pop', nome: 'Pop / Hits', icone: 'star', cor: '#D81B60' },
  { id: 'preset_eletronica', nome: 'Eletrônica', icone: 'lightning-bolt', cor: '#8E24AA' },
  { id: 'preset_treino', nome: 'Treino / Gym', icone: 'dumbbell', cor: '#FB8C00' },
  { id: 'preset_chill', nome: 'Chill / Lo-Fi', icone: 'coffee', cor: '#00897B' },
];

// Exibe a capa da playlist por prioridade: galeria -> preset -> capa da 1ª música local -> mascote Nyx
export function RenderizarCapaPlaylist({ capaInfo, musicasDaPlaylist, musicasLocais, tamanho = 54, tema }) {
  const estiloImg = { width: tamanho, height: tamanho, borderRadius: Math.round(tamanho * 0.22) };

  if (capaInfo?.tipo === 'galeria' && capaInfo.uri) {
    return <Image source={{ uri: capaInfo.uri }} style={estiloImg} />;
  }

  if (capaInfo?.tipo === 'preset') {
    const preset = CAPAS_PRE_SELECIONADAS.find((p) => p.id === capaInfo.id);
    if (preset?.source) {
      return (
        <View style={[estiloImg, styles.caixaCentralizada, { backgroundColor: tema.primariaClara }]}>
          <Image source={preset.source} style={{ width: tamanho * 0.88, height: tamanho * 0.88 }} resizeMode="contain" />
        </View>
      );
    }
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
      <Image source={MASCOTE.carinho} style={{ width: tamanho * 0.85, height: tamanho * 0.85 }} resizeMode="contain" />
    </View>
  );
}

// Modal reutilizável para escolher capa na criação e na edição da playlist
// Referência ImagePicker: https://docs.expo.dev/versions/latest/sdk/imagepicker/
export function ModalEscolherCapa({ visivel, aoFechar, aoEscolherCapa, tema, titulo = 'Capa da Playlist' }) {
  const escolherDaGaleria = async () => {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) {
        exibirAviso('Permissão necessária', 'Precisamos de acesso à galeria para definir a capa.');
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

          <Text style={[styles.subtituloModal, { color: tema.subtexto }]}>Ou escolha uma capa do Nyx / Estilo:</Text>
          <ScrollView style={styles.scrollPresets} showsVerticalScrollIndicator={false}>
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
                    <View style={[styles.imgPreset, styles.caixaCentralizada, { backgroundColor: tema.primariaClara }]}>
                      <Image source={p.source} style={{ width: 50, height: 50 }} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={[styles.imgPreset, styles.caixaCentralizada, { backgroundColor: p.cor }]}>
                      <MaterialCommunityIcons name={p.icone} size={28} color="#FFF" />
                    </View>
                  )}
                  <Text style={{ fontSize: 11, color: tema.texto, marginTop: 4, textAlign: 'center' }} numberOfLines={1}>
                    {p.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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
    if (playlistsGlobais[nome]) {
      exibirAviso('Nome já usado', `Você já tem uma playlist chamada "${nome}". Escolha outro nome.`);
      return;
    }

    try {
      vibrar(45);
      await firebase.database().ref(`users/${usuario.uid}/playlists/${nome}`).set({
        criadaEm: Date.now(),
        capa: capaEscolhida || null,
      });
      setNovaPlaylist('');
      setCapaEscolhida(null);
    } catch (e) {}
  };

  const nomesPlaylists = Object.keys(playlistsGlobais);

  return (
    <AnimarEntrada style={[styles.container, { backgroundColor: tema.bg }]}>
      <BannerMascote
        pose={MASCOTE.carinho}
        titulo="Minhas Playlists"
        subtitulo={`${nomesPlaylists.length} coleção(ões) guardada(s) pelo Nyx`}
        tema={tema}
      />

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
          style={[styles.input, { backgroundColor: tema.card, color: tema.texto, borderColor: tema.borda }]}
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
        data={nomesPlaylists}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const dadosPl = playlistsGlobais[item];
          const quantidade = dadosPl?.musicas ? Object.keys(dadosPl.musicas).length : 0;
          return (
            <TouchableOpacity
              style={[styles.itemPlaylist, { backgroundColor: tema.card, borderColor: tema.borda }]}
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
          <View style={styles.vazioContainer}>
            <Image source={MASCOTE.carinho} style={{ width: 110, height: 110, marginBottom: 8 }} />
            <Text style={[styles.vazioText, { color: tema.subtexto }]}>
              Nenhuma playlist criada ainda. Crie sua primeira coleção com o Nyx acima!
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />

      <ModalEscolherCapa
        visivel={modalCapaVisivel}
        aoFechar={() => setModalCapaVisivel(false)}
        aoEscolherCapa={setCapaEscolhida}
        tema={tema}
      />
    </AnimarEntrada>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 45 },
  caixaCentralizada: { justifyContent: 'center', alignItems: 'center' },
  criarContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  botaoCapaCriar: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 2, overflow: 'hidden' },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, borderWidth: 1, elevation: 1 },
  botaoCriar: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  itemPlaylist: { flexDirection: 'row', padding: 12, borderRadius: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, elevation: 1 },
  nomePlaylist: { fontSize: 17, fontWeight: 'bold' },
  quantidadeText: { fontSize: 13, marginTop: 3 },
  vazioContainer: { alignItems: 'center', marginTop: 30, paddingHorizontal: 20 },
  vazioText: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  modalFundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '90%', borderRadius: 20, padding: 20 },
  modalTitulo: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  botaoGaleria: { flexDirection: 'row', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  textoGaleria: { color: '#FFF', fontWeight: 'bold', marginLeft: 8 },
  subtituloModal: { fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  scrollPresets: { maxHeight: 370, width: '100%' },
  gradePresets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  itemPreset: { alignItems: 'center', width: '30%', marginBottom: 10 },
  imgPreset: { width: 62, height: 62, borderRadius: 14, overflow: 'hidden' },
});
