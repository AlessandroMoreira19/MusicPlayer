import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext } from '../App';
import { extrairTags } from './ExtrairTags';

export default function ListarItens({ navigation }) {
  const { musicas, setMusicas, tocarAgora, abrirMenuOpcoes } = useContext(MusicasContext);
  const [carregando, setCarregando] = useState(false);

  const formatarTempo = (segundos) => {
    if (!segundos) return '00:00';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const selecionarVariasMusicas = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg', 
        multiple: true,     
        copyToCacheDirectory: true,
      });

      if (!resultado.canceled) {
        setCarregando(true); 
        
        const novasMusicas = [];
        for (const item of resultado.assets) {
          const jaExisteNaLista = musicas.some(
            (antiga) => antiga.uri === item.uri || antiga.name.toLowerCase() === item.name.toLowerCase()
          );
          const jaExisteNoLote = novasMusicas.some(
            (nova) => nova.uri === item.uri || nova.name.toLowerCase() === item.name.toLowerCase()
          );

          if (!jaExisteNaLista && !jaExisteNoLote) {
            const tags = await extrairTags(item.uri, item.name);
            novasMusicas.push({ uri: item.uri, name: item.name, tags: tags });
          }
        }

        if (novasMusicas.length > 0) {
          setMusicas((musicasAnteriores) => [...musicasAnteriores, ...novasMusicas]);
        }
        setCarregando(false);
      }
    } catch (erro) {
      console.warn("Erro ao selecionar documentos:", erro);
      setCarregando(false);
    }
  };

  const tocarMusica = (item) => {
    tocarAgora(item, musicas);
    navigation.navigate('Reproduzir');
  };

  const removerMusica = (uriParaRemover) => {
    setMusicas((musicasAnteriores) => musicasAnteriores.filter((musica) => musica.uri !== uriParaRemover));
  };

  const renderizarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => tocarMusica(item)}
      onLongPress={() => abrirMenuOpcoes(item)}
      delayLongPress={300}
    >
      <View style={styles.iconeContainer}>
        <MaterialCommunityIcons name="music-note" size={24} color="purple" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nomeMusica} numberOfLines={1}>
          {item.tags?.title || item.name.replace('.mp3', '')}
        </Text>
        <Text style={styles.nomeArtista} numberOfLines={1}>
          {item.tags?.artist || 'Artista Desconhecido'}
        </Text>
      </View>
      <Text style={styles.duracaoTexto}>{formatarTempo(item.tags?.duration)}</Text>
      <TouchableOpacity style={styles.botaoRemover} onPress={() => removerMusica(item.uri)}>
        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Músicas</Text>
      
      <TouchableOpacity style={styles.botao} onPress={selecionarVariasMusicas} disabled={carregando}>
        {carregando ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="playlist-plus" size={24} color="white" />}
        <Text style={styles.textoBotao}>
          {carregando ? "Processando tags..." : "Adicionar Músicas"}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={musicas}
        keyExtractor={(item) => item.uri}
        renderItem={renderizarItem}
        ListEmptyComponent={
          <View style={styles.vazioContainer}>
            <Text style={styles.textoCentro}>Nenhuma música carregada. Segure em uma música para mais opções.</Text>
          </View>
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
  botao: { flexDirection: 'row', backgroundColor: 'purple', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10, alignItems: 'center', gap: 10, marginBottom: 20, width: '90%', justifyContent: 'center' },
  textoBotao: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  lista: { width: '100%', paddingHorizontal: 16 },
  itemContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 2 },
  iconeContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f2e6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  nomeArtista: { fontSize: 12, color: '#666', marginTop: 2 },
  duracaoTexto: { fontSize: 12, color: '#888', fontWeight: 'bold', marginHorizontal: 8 },
  botaoRemover: { padding: 6 },
  vazioContainer: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
  textoCentro: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
});