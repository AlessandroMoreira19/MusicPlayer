import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { MusicasContext } from '../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const formatarTempo = (segundos) => {
  if (!segundos) return '00:00';
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg < 10 ? '0' : ''}${seg}`;
};

export default function TelaPlaylist({ route, navigation }) {
  const { nomePlaylist } = route.params;
  const { playlistsGlobais, musicas, tocarAgora, abrirMenuOpcoes } = useContext(MusicasContext);

  const musicasFirebase = playlistsGlobais[nomePlaylist]?.musicas || {};
  const musicasArray = Object.values(musicasFirebase);

  const listaCompletaDaPlaylist = musicasArray.map((itemFb) => {
    const musicaLocal = musicas.find(
      (m) => m.uri === itemFb.uri || m.name?.replace('.mp3', '') === itemFb.title
    );
    return musicaLocal || itemFb;
  });

  const tocarMusica = (item) => {
    tocarAgora(item, listaCompletaDaPlaylist);
    navigation.navigate('Reproduzir');
  };

  const renderizarItem = ({ item }) => {
    const capaUri = item.tags?.artwork || null;
    const titulo = item.tags?.title || item.title || item.name?.replace('.mp3', '');
    const artista = item.tags?.artist || item.artist || 'Artista Desconhecido';
    const duracao = item.tags?.duration || item.duration || 0;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => tocarMusica(item)}
        onLongPress={() => abrirMenuOpcoes(item)}
        delayLongPress={300}
      >
        {capaUri ? (
          <Image source={{ uri: capaUri }} style={styles.capaMusica} />
        ) : (
          <View style={[styles.capaMusica, { backgroundColor: '#f2e6ff', justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="music" size={24} color="purple" />
          </View>
        )}
        
        <View style={styles.infoContainer}>
          <Text style={styles.nomeMusica} numberOfLines={1}>{titulo}</Text>
          <Text style={styles.nomeArtista} numberOfLines={1}>{artista}</Text>
        </View>

        <View style={styles.duracaoContainer}>
          <MaterialCommunityIcons name="clock-outline" size={14} color="#888" />
          <Text style={styles.textoTempo}>{formatarTempo(duracao)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.circuloDestaque}>
          <MaterialCommunityIcons name="playlist-music" size={60} color="white" />
        </View>
        <Text style={styles.tituloHeader}>{nomePlaylist}</Text>
        <Text style={styles.quantidade}>{listaCompletaDaPlaylist.length} música(s)</Text>
      </View>

      <FlatList
        data={listaCompletaDaPlaylist}
        keyExtractor={(item, index) => `${item.uri}_${index}`}
        renderItem={renderizarItem}
        ListEmptyComponent={<Text style={styles.vazioText}>Esta playlist ainda não tem músicas.</Text>}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D3D3D3' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF', elevation: 3, marginBottom: 15, position: 'relative' },
  botaoVoltar: { position: 'absolute', top: 30, left: 20, zIndex: 10, padding: 5 },
  circuloDestaque: { width: 120, height: 120, borderRadius: 15, backgroundColor: 'purple', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  tituloHeader: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', paddingHorizontal: 10 },
  quantidade: { fontSize: 14, color: '#888', marginTop: 5 },
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
  capaMusica: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  nomeArtista: { fontSize: 14, color: '#666', marginTop: 3 },
  duracaoContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  textoTempo: { fontSize: 13, color: '#888', fontWeight: 'bold' },
  vazioText: { textAlign: 'center', color: '#666', marginTop: 20, fontSize: 15 }
});