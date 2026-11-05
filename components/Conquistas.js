import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext } from '../App';
import firebase from '../config/config';

export default function Conquistas() {
  const { usuario } = useContext(MusicasContext);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario) return;

    const ref = firebase.database().ref(`users/${usuario.uid}/conquistas`);
    
    const listener = ref.on('value', (snapshot) => {
      if (snapshot.exists()) {
        setDados(snapshot.val());
      } else {
        setDados(null);
      }
      setCarregando(false);
    });

    return () => ref.off('value', listener);
  }, [usuario]);

  if (carregando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="purple" />
        <Text style={{ marginTop: 15, color: '#555' }}>A carregar as suas conquistas...</Text>
      </View>
    );
  }

  if (!dados) {
    return (
      <View style={styles.centro}>
        <MaterialCommunityIcons name="trophy-broken" size={70} color="#888" />
        <Text style={styles.textoVazio}>Ainda não há dados suficientes.</Text>
        <Text style={styles.textoSub}>Ouça algumas músicas até ao fim para gerar estatísticas!</Text>
      </View>
    );
  }

  const musicasArray = dados.musicas ? Object.values(dados.musicas) : [];
  const topMusicas = musicasArray.sort((a, b) => b.reproducoes - a.reproducoes).slice(0, 5);

  const artistasArray = dados.artistas ? Object.entries(dados.artistas).map(([nome, info]) => ({ nome, ...info })) : [];
  const topArtistas = artistasArray.sort((a, b) => b.reproducoes - a.reproducoes).slice(0, 5);

  const albunsArray = dados.albuns ? Object.entries(dados.albuns).map(([nome, info]) => ({ nome, ...info })) : [];
  const topAlbuns = albunsArray.sort((a, b) => b.reproducoes - a.reproducoes).slice(0, 5);

  const tempoTotalSegundos = dados.tempoMensal ? Object.values(dados.tempoMensal).reduce((acc, curr) => acc + curr, 0) : 0;
  const tempoTotalHoras = (tempoTotalSegundos / 3600).toFixed(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40, paddingTop: 40 }}>
      <Text style={styles.titulo}>Estatísticas</Text>

      <View style={styles.cardDestaque}>
        <View style={styles.circuloIcone}>
          <MaterialCommunityIcons name="clock-fast" size={32} color="white" />
        </View>
        <View style={styles.infoDestaque}>
          <Text style={styles.textoDestaque}>Tempo de Audição Total</Text>
          <Text style={styles.valorDestaque}>{tempoTotalHoras} Horas</Text>
        </View>
      </View>

      <Text style={styles.subtitulo}>Top 5 Músicas</Text>
      <View style={styles.cardLista}>
        {topMusicas.length > 0 ? topMusicas.map((musica, index) => (
          <View key={index} style={styles.itemLista}>
            <Text style={styles.posicao}>{index + 1}º</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeItem} numberOfLines={1}>{musica.titulo}</Text>
              <Text style={styles.detalheItem}>{musica.artista} • {musica.reproducoes} reproduções</Text>
            </View>
            {index === 0 && <MaterialCommunityIcons name="music-note-star" size={24} color="#1DB954" />}
          </View>
        )) : <Text style={styles.textoVazioPequeno}>Sem dados de músicas.</Text>}
      </View>

      <Text style={styles.subtitulo}>Top 5 Artistas</Text>
      <View style={styles.cardLista}>
        {topArtistas.length > 0 ? topArtistas.map((artista, index) => (
          <View key={index} style={styles.itemLista}>
            <Text style={styles.posicao}>{index + 1}º</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeItem} numberOfLines={1}>{artista.nome}</Text>
              <Text style={styles.detalheItem}>{artista.reproducoes} reproduções</Text>
            </View>
            {index === 0 && <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />}
          </View>
        )) : <Text style={styles.textoVazioPequeno}>Sem dados de artistas.</Text>}
      </View>

      <Text style={styles.subtitulo}>Top 5 Álbuns</Text>
      <View style={styles.cardLista}>
        {topAlbuns.length > 0 ? topAlbuns.map((album, index) => (
          <View key={index} style={styles.itemLista}>
            <Text style={styles.posicao}>{index + 1}º</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nomeItem} numberOfLines={1}>{album.nome}</Text>
              <Text style={styles.detalheItem}>{album.reproducoes} reproduções</Text>
            </View>
            {index === 0 && <MaterialCommunityIcons name="disc" size={24} color="#C0C0C0" />}
          </View>
        )) : <Text style={styles.textoVazioPequeno}>Sem dados de álbuns.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D3D3D3', paddingHorizontal: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D3D3D3', padding: 20 },
  titulo: { fontSize: 28, fontWeight: 'bold', color: 'purple', marginBottom: 20, textAlign: 'center' },
  subtitulo: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 25, marginBottom: 10, marginLeft: 5 },
  
  cardDestaque: { flexDirection: 'row', backgroundColor: 'purple', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 4, marginBottom: 10 },
  circuloIcone: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 30, marginRight: 15 },
  infoDestaque: { flex: 1 },
  textoDestaque: { color: '#E0E0E0', fontSize: 14, fontWeight: '600' },
  valorDestaque: { color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 2 },
  
  cardLista: { backgroundColor: '#FFF', borderRadius: 15, padding: 15, elevation: 2 },
  itemLista: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingVertical: 12 },
  posicao: { fontSize: 18, fontWeight: 'bold', color: 'purple', width: 40 },
  nomeItem: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detalheItem: { fontSize: 13, color: '#888', marginTop: 2 },
  
  textoVazio: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 15, textAlign: 'center' },
  textoSub: { fontSize: 14, color: '#888', marginTop: 5, textAlign: 'center' },
  textoVazioPequeno: { color: '#888', fontStyle: 'italic', textAlign: 'center', padding: 10 }
});