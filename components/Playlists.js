import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext } from '../App';
import firebase from '../config/config';

export default function Playlists({ navigation }) {
  const { usuario, playlistsGlobais } = useContext(MusicasContext);
  const [novaPlaylist, setNovaPlaylist] = useState('');

  const criarPlaylist = () => {
    const nome = novaPlaylist.trim();
    if (nome === '') return;
    
    firebase.database().ref(`users/${usuario.uid}/playlists/${nome}`).set({ criadaEm: Date.now() });
    setNovaPlaylist('');
  };

  const abrirPlaylist = (nome) => {
    navigation.navigate('TelaPlaylist', { nomePlaylist: nome });
  };

  const listasDePlaylists = Object.keys(playlistsGlobais);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Playlists</Text>

      <View style={styles.criarContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nome da nova playlist..."
          value={novaPlaylist}
          onChangeText={setNovaPlaylist}
        />
        <TouchableOpacity style={styles.botaoCriar} onPress={criarPlaylist}>
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listasDePlaylists}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const quantidade = playlistsGlobais[item]?.musicas ? Object.keys(playlistsGlobais[item].musicas).length : 0;
          return (
            <TouchableOpacity style={styles.itemPlaylist} onPress={() => abrirPlaylist(item)}>
              <View style={styles.iconeContainer}>
                <MaterialCommunityIcons name="playlist-music" size={30} color="purple" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nomePlaylist}>{item}</Text>
                <Text style={styles.quantidadeText}>{quantidade} música(s)</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#888" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.vazioText}>Nenhuma playlist criada. Crie a primeira acima!</Text>}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D3D3D3', paddingTop: 40 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: 'purple', marginBottom: 20, textAlign: 'center' },
  criarContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 20 },
  input: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 15, fontSize: 16, elevation: 2 },
  botaoCriar: { backgroundColor: 'purple', width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 },
  itemPlaylist: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
  iconeContainer: { width: 50, height: 50, borderRadius: 10, backgroundColor: '#f2e6ff', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  nomePlaylist: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  quantidadeText: { fontSize: 14, color: '#888', marginTop: 3 },
  vazioText: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 16 }
});