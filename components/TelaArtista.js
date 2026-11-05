import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MusicasContext } from '../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TelaArtista({ route, navigation }) {
  const { nomeArtista } = route.params;
  const { musicas, tocarAgora, abrirMenuOpcoes } = useContext(MusicasContext);

  const musicasDoArtista = musicas.filter(m => m.tags?.artist === nomeArtista);

  const formatarTempo = (segundos) => {
    if (!segundos) return '00:00';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const tocarMusica = (item) => {
    tocarAgora(item, musicasDoArtista);
    navigation.navigate('Reproduzir');
  };

  const renderizarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => tocarMusica(item)}
      onLongPress={() => abrirMenuOpcoes(item)}
      delayLongPress={300}
    >
      <MaterialCommunityIcons name="play-circle" size={30} color="purple" style={{ marginRight: 15 }} />
      <View style={styles.infoContainer}>
        <Text style={styles.nomeMusica} numberOfLines={1}>
          {item.tags?.title || item.name.replace('.mp3', '')}
        </Text>
        <Text style={styles.nomeAlbum} numberOfLines={1}>
          {item.tags?.album || 'Sem Álbum'}
        </Text>
      </View>
      <Text style={styles.duracaoTexto}>{formatarTempo(item.tags?.duration)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.circuloArtista}>
          <MaterialCommunityIcons name="account-music" size={60} color="white" />
        </View>
        <Text style={styles.tituloArtista}>{nomeArtista}</Text>
        <Text style={styles.quantidade}>{musicasDoArtista.length} música(s)</Text>
      </View>

      <FlatList
        data={musicasDoArtista}
        keyExtractor={(item) => item.uri}
        renderItem={renderizarItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D3D3D3' },
  header: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF', elevation: 3, marginBottom: 15, position: 'relative' },
  botaoVoltar: { position: 'absolute', top: 30, left: 20, zIndex: 10, padding: 5 },
  circuloArtista: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'purple', justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 5 },
  tituloArtista: { fontSize: 22, fontWeight: 'bold', color: '#333', textAlign: 'center', paddingHorizontal: 10 },
  quantidade: { fontSize: 14, color: '#888', marginTop: 5 },
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  nomeAlbum: { fontSize: 14, color: '#666', marginTop: 3 },
  duracaoTexto: { fontSize: 13, color: '#888', fontWeight: 'bold', marginLeft: 10 }
});