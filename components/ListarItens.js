import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ListarItens({ navigation }) {
  const [musicas, setMusicas] = useState([]);

  const selecionarVariasMusicas = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg', 
        multiple: true,     
        copyToCacheDirectory: false,
      });

      if (!resultado.canceled) {
        setMusicas((musicasAnteriores) => {
          // Filtra para não adicionar a mesma música duas vezes se você selecioná-la novamente
          const novasMusicas = resultado.assets.filter(
            (nova) => !musicasAnteriores.some((antiga) => antiga.uri === nova.uri)
          );
          
          // Junta as músicas que já estavam na lista com as novas
          return [...musicasAnteriores, ...novasMusicas];
        });
      }
    } catch (erro) {
      console.warn("Erro ao selecionar documentos:", erro);
    }
  };

  const tocarMusica = (item) => {
    navigation.navigate('Reproduzir', { 
      musicaSelecionada: {
        uri: item.uri,
        filename: item.name, 
      } 
    });
  };

  const removerMusica = (uriParaRemover) => {
    // Filtra a lista mantendo apenas as músicas que têm a URI diferente da que queremos apagar
    setMusicas((musicasAnteriores) => 
      musicasAnteriores.filter((musica) => musica.uri !== uriParaRemover)
    );
  };

  const renderizarItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => tocarMusica(item)}>
      <View style={styles.iconeContainer}>
        <MaterialCommunityIcons name="music-note" size={24} color="purple" />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.nomeMusica} numberOfLines={1}>
          {item.name.replace('.mp3', '')}
        </Text>
      </View>

      {/* Botão de lixeira para apagar a música da lista */}
      <TouchableOpacity 
        style={styles.botaoRemover} 
        onPress={() => removerMusica(item.uri)}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Músicas</Text>
      
      <TouchableOpacity style={styles.botao} onPress={selecionarVariasMusicas}>
        <MaterialCommunityIcons name="playlist-plus" size={24} color="white" />
        <Text style={styles.textoBotao}>Adicionar Músicas da Pasta</Text>
      </TouchableOpacity>

      <FlatList
        data={musicas}
        keyExtractor={(item) => item.uri}
        renderItem={renderizarItem}
        ListEmptyComponent={
          <View style={styles.vazioContainer}>
            <Text style={styles.textoCentro}>
              Nenhuma música carregada. Toque no botão acima, entre na sua pasta de músicas e selecione os arquivos.
            </Text>
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
  botao: {
    flexDirection: 'row',
    backgroundColor: 'purple',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    width: '90%',
    justifyContent: 'center',
  },
  textoBotao: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  lista: { width: '100%', paddingHorizontal: 16 },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  iconeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  botaoRemover: {
    padding: 8,
    marginLeft: 10,
  },
  vazioContainer: { marginTop: 40, alignItems: 'center', paddingHorizontal: 20 },
  textoCentro: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
});




/*
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function ListarItens({ navigation }) {
  const [musicas, setMusicas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  // Hook oficial do Expo para gerir permissões
  const [permissao, pedirPermissao] = MediaLibrary.usePermissions();

  const selecionarMusicaManual = async () => {
    const resultado = await DocumentPicker.getDocumentAsync({
      type: 'audio/mpeg', // Filtra apenas MP3
      copyToCacheDirectory: false,
    });

    if (!resultado.canceled) {
      const arquivo = resultado.assets[0];
      navigation.navigate('Reproduzir', {
        musicaSelecionada: {
          uri: arquivo.uri,
          filename: arquivo.name,
        }
      });
    }
  };

  useEffect(() => {
    async function carregar() {
      if (permissao?.status !== 'granted') {
        const resposta = await pedirPermissao();
        if (resposta.status === 'granted') {
          buscarMusicasLocais();
        } else {
          setCarregando(false);
        }
      } else {
        buscarMusicasLocais();
      }
    }
    carregar();
  }, [permissao]);

  const buscarMusicasLocais = async () => {
    try {
      // Busca ficheiros de áudio (pode aumentar o 'first' se tiver muitas músicas)
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
        first: 500,
      });

      // Filtra para garantir que apenas ficheiros .mp3 são listados
      const apenasMp3 = media.assets.filter(ficheiro =>
        ficheiro.filename.toLowerCase().endsWith('.mp3')
      );

      setMusicas(apenasMp3);
    } catch (erro) {
      console.warn('Erro ao procurar músicas:', erro);
    } finally {
      setCarregando(false);
    }
  };

  const selecionarMusica = (item) => {
    // Navega para o ecrã Reproduzir e envia o objeto da música escolhida
    navigation.navigate('Reproduzir', { musicaSelecionada: item });
  };

  // Formata a duração recebida do MediaLibrary (que vem em segundos)
  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const renderizarItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => selecionarMusica(item)}>
      <View style={styles.iconeContainer}>
        <MaterialCommunityIcons name="music-note" size={24} color="purple" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.nomeMusica} numberOfLines={1}>
          {item.filename.replace('.mp3', '')}
        </Text>
        <Text style={styles.duracaoMusica}>{formatarTempo(item.duration)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="purple" />
        <Text style={styles.textoCentro}>A procurar músicas...</Text>
      </View>
    );
  }

  if (permissao?.status !== 'granted') {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoCentro}>O leitor precisa de acesso aos seus ficheiros de áudio.</Text>
        <TouchableOpacity style={styles.botaoPermissao} onPress={pedirPermissao}>
          <Text style={styles.textoBotao}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Minhas Músicas</Text>
      <FlatList
        data={musicas}
        keyExtractor={(item) => item.id}
        renderItem={renderizarItem}
        ListEmptyComponent={<Text style={styles.textoCentro}>Nenhum .mp3 encontrado no telemóvel.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D3D3D3', paddingHorizontal: 16, paddingTop: 20 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D3D3D3' },
  titulo: { fontSize: 24, fontWeight: 'bold', color: 'purple', marginBottom: 16, marginTop: 20 },
  textoCentro: { fontSize: 16, color: '#555', marginTop: 10, textAlign: 'center', paddingHorizontal: 20 },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  iconeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2e6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  duracaoMusica: { fontSize: 14, color: '#888', marginTop: 4 },
  botaoPermissao: {
    backgroundColor: 'purple',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  textoBotao: { color: '#FFF', fontWeight: 'bold' },
});

*/