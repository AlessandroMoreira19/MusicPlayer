import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext } from '../App';

export default function BuscarItens({ navigation }) {
  const { musicas, tocarAgora, abrirMenuOpcoes } = useContext(MusicasContext);
  const [textoBusca, setTextoBusca] = useState('');

  const formatarTempo = (segundos) => {
    if (!segundos) return '';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const obterResultadosBusca = () => {
    if (textoBusca.length === 0) return [];
    const texto = textoBusca.toLowerCase();
    const resultados = [];

    musicas.forEach(m => {
      const titulo = m.tags?.title || m.name.replace('.mp3', '');
      const artista = m.tags?.artist || 'Artista Desconhecido';
      if (titulo.toLowerCase().includes(texto) || artista.toLowerCase().includes(texto)) {
        resultados.push({ id: `musica_${m.uri}`, tipo: 'musica', nome: titulo, extra: artista, original: m });
      }
    });

    const albunsUnicos = Array.from(new Set(musicas.map(m => m.tags?.album).filter(a => a && a !== 'Sem Álbum')));
    albunsUnicos.forEach(album => {
      if (album.toLowerCase().includes(texto)) {
        resultados.push({ id: `album_${album}`, tipo: 'album', nome: album, extra: 'Álbum' });
      }
    });

    const artistasUnicos = Array.from(new Set(musicas.map(m => m.tags?.artist).filter(a => a && a !== 'Artista Desconhecido')));
    artistasUnicos.forEach(artista => {
      if (artista.toLowerCase().includes(texto)) {
        resultados.push({ id: `artista_${artista}`, tipo: 'artista', nome: artista, extra: 'Artista' });
      }
    });

    return resultados;
  };

  const acaoAoClicar = (item) => {
    if (item.tipo === 'musica') {
      tocarAgora(item.original);
      navigation.navigate('Reproduzir');
    } else if (item.tipo === 'album') {
      navigation.navigate('Album', { nomeAlbum: item.nome });
    } else if (item.tipo === 'artista') {
      navigation.navigate('Artista', { nomeArtista: item.nome });
    }
  };

  const getIcone = (tipo) => {
    if (tipo === 'musica') return 'music-note';
    if (tipo === 'album') return 'album';
    return 'account-music';
  };

  const renderizarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => acaoAoClicar(item)}
      onLongPress={() => item.tipo === 'musica' && abrirMenuOpcoes(item.original)}
      delayLongPress={300}
    >
      <View style={styles.iconeContainer}>
        <MaterialCommunityIcons name={getIcone(item.tipo)} size={24} color="purple" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nomeBusca} numberOfLines={1}>{item.nome}</Text>
        <Text style={styles.textoExtra}>{item.extra}</Text>
      </View>
      {item.tipo === 'musica' && (
        <Text style={{ fontSize: 12, color: '#888', fontWeight: 'bold', marginRight: 10 }}>
          {formatarTempo(item.original?.tags?.duration)}
        </Text>
      )}
      <MaterialCommunityIcons name="chevron-right" size={24} color="#888" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Buscar</Text>
      <View style={styles.buscaContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#888" />
        <TextInput
          style={styles.inputBusca}
          placeholder="Música, Álbum ou Artista..."
          value={textoBusca}
          onChangeText={setTextoBusca}
          placeholderTextColor="#888"
        />
        {textoBusca.length > 0 && (
          <TouchableOpacity onPress={() => setTextoBusca('')}>
            <MaterialCommunityIcons name="close-circle" size={22} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={obterResultadosBusca()}
        keyExtractor={(item) => item.id}
        renderItem={renderizarItem}
        ListEmptyComponent={
          textoBusca.length > 0 ? <Text style={styles.textoCentro}>Nenhum resultado para "{textoBusca}".</Text> : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        style={styles.lista}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D3D3D3', alignItems: 'center', paddingTop: 40 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: 'purple', marginBottom: 20 },
  buscaContainer: { flexDirection: 'row', backgroundColor: '#FFF', width: '90%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20, elevation: 3 },
  inputBusca: { flex: 1, marginLeft: 10, fontSize: 16, color: '#333' },
  lista: { width: '100%', paddingHorizontal: 16 },
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
  iconeContainer: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#f2e6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContainer: { flex: 1 },
  nomeBusca: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  textoExtra: { fontSize: 13, color: '#666', marginTop: 2 },
  textoCentro: { fontSize: 15, color: '#555', textAlign: 'center', marginTop: 20 },
});