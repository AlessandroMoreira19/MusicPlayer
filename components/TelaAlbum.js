import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext, formatarTempo } from '../App';

export default function TelaAlbum({ route, navigation }) {
  const { nomeAlbum = '' } = route.params || {};
  const { musicas, tocarAgora, tocarLista, abrirMenuOpcoes, tema } = useContext(MusicasContext);

  const musicasDoAlbum = musicas.filter((m) => m.tags?.album === nomeAlbum);
  const capaAlbum = musicasDoAlbum.find((m) => m.tags?.artwork)?.tags?.artwork;

  const iniciarLista = (aleatorio) => {
    tocarLista(musicasDoAlbum, aleatorio);
    navigation.navigate('Reproduzir');
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <View style={[styles.header, { backgroundColor: tema.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={tema.texto} />
        </TouchableOpacity>

        {capaAlbum ? (
          <Image source={{ uri: capaAlbum }} style={styles.capa} />
        ) : (
          <View style={[styles.capa, styles.caixaCentralizada, { backgroundColor: tema.primaria }]}>
            <MaterialCommunityIcons name="album" size={60} color="white" />
          </View>
        )}

        <Text style={[styles.tituloAlbum, { color: tema.texto }]}>{nomeAlbum}</Text>
        <Text style={[styles.quantidade, { color: tema.subtexto }]}>{musicasDoAlbum.length} música(s)</Text>

        <View style={styles.botoesHeader}>
          <TouchableOpacity style={[styles.botaoPlay, { backgroundColor: tema.primaria }]} onPress={() => iniciarLista(false)}>
            <MaterialCommunityIcons name="play" size={20} color="#FFF" />
            <Text style={styles.textoBotao}>Reproduzir</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.botaoPlay, { backgroundColor: tema.primariaClara }]} onPress={() => iniciarLista(true)}>
            <MaterialCommunityIcons name="shuffle-variant" size={20} color={tema.primaria} />
            <Text style={[styles.textoBotao, { color: tema.primaria }]}>Aleatório</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={musicasDoAlbum}
        keyExtractor={(item) => item.uri}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.itemContainer, { backgroundColor: tema.card }]}
            onPress={() => {
              tocarAgora(item, musicasDoAlbum);
              navigation.navigate('Reproduzir');
            }}
            onLongPress={() => abrirMenuOpcoes(item)}
            delayLongPress={300}
          >
            {item.tags?.artwork ? (
              <Image source={{ uri: item.tags.artwork }} style={styles.capaItem} />
            ) : (
              <View style={[styles.capaItem, { backgroundColor: tema.primariaClara }]}>
                <MaterialCommunityIcons name="music-note" size={24} color={tema.primaria} />
              </View>
            )}
            <View style={styles.infoContainer}>
              <Text style={[styles.nomeMusica, { color: tema.texto }]} numberOfLines={1}>
                {item.tags?.title || item.name.replace('.mp3', '')}
              </Text>
              <Text style={[styles.nomeArtista, { color: tema.subtexto }]} numberOfLines={1}>
                {item.tags?.artist || 'Artista Desconhecido'}
              </Text>
            </View>
            <Text style={[styles.duracaoTexto, { color: tema.subtexto }]}>{formatarTempo(item.tags?.duration)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  caixaCentralizada: { justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingTop: 45, paddingBottom: 20, elevation: 3, marginBottom: 15, position: 'relative' },
  botaoVoltar: { position: 'absolute', top: 45, left: 20, zIndex: 10, padding: 5 },
  capa: { width: 140, height: 140, borderRadius: 15, marginBottom: 12, elevation: 5 },
  tituloAlbum: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 10 },
  quantidade: { fontSize: 14, marginTop: 4 },
  botoesHeader: { flexDirection: 'row', gap: 12, marginTop: 14 },
  botaoPlay: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, gap: 6 },
  textoBotao: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  itemContainer: { flexDirection: 'row', padding: 10, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 2 },
  capaItem: { width: 48, height: 48, borderRadius: 8, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 15, fontWeight: 'bold' },
  nomeArtista: { fontSize: 13, marginTop: 3 },
  duracaoTexto: { fontSize: 12, fontWeight: 'bold', marginLeft: 10 },
});
