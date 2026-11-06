import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext } from '../App';
import firebase from '../config/config';

export default function Conquistas() {
  const { usuario, tema } = useContext(MusicasContext);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    const ref = firebase.database().ref(`users/${usuario.uid}/conquistas`);
    const listener = ref.on('value', (snapshot) => {
      setDados(snapshot.exists() ? snapshot.val() : null);
      setCarregando(false);
    });
    return () => ref.off('value', listener);
  }, [usuario]);

  if (carregando) {
    return (
      <View style={[styles.centro, { backgroundColor: tema.bg }]}>
        <ActivityIndicator size="large" color={tema.primaria} />
      </View>
    );
  }

  if (!dados) {
    return (
      <View style={[styles.centro, { backgroundColor: tema.bg }]}>
        <MaterialCommunityIcons name="trophy-broken" size={70} color={tema.subtexto} />
        <Text style={[styles.textoVazio, { color: tema.texto }]}>Ainda não há dados suficientes.</Text>
        <Text style={[styles.textoSub, { color: tema.subtexto }]}>
          Ouça algumas músicas até ao fim para gerar estatísticas!
        </Text>
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
    <ScrollView style={[styles.container, { backgroundColor: tema.bg }]} contentContainerStyle={{ paddingBottom: 40, paddingTop: 45 }}>
      <Text style={[styles.titulo, { color: tema.primaria }]}>Conquistas e Estatísticas</Text>

      <View style={[styles.cardDestaque, { backgroundColor: tema.primaria }]}>
        <View style={styles.circuloIcone}>
          <MaterialCommunityIcons name="clock-fast" size={32} color="white" />
        </View>
        <View style={styles.infoDestaque}>
          <Text style={styles.textoDestaque}>Tempo de Audição Total</Text>
          <Text style={styles.valorDestaque}>{tempoTotalHoras} Horas</Text>
        </View>
      </View>

      <Text style={[styles.subtitulo, { color: tema.texto }]}>Top 5 Músicas</Text>
      <View style={[styles.cardLista, { backgroundColor: tema.card }]}>
        {topMusicas.map((musica, index) => (
          <View key={index} style={[styles.itemLista, { borderBottomColor: tema.borda }]}>
            <Text style={[styles.posicao, { color: tema.primaria }]}>{index + 1}º</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nomeItem, { color: tema.texto }]} numberOfLines={1}>{musica.titulo}</Text>
              <Text style={[styles.detalheItem, { color: tema.subtexto }]}>{musica.artista} • {musica.reproducoes} reproduções</Text>
            </View>
            {index === 0 && <MaterialCommunityIcons name="star-circle" size={24} color="#1DB954" />}
          </View>
        ))}
      </View>

      <Text style={[styles.subtitulo, { color: tema.texto }]}>Top 5 Artistas</Text>
      <View style={[styles.cardLista, { backgroundColor: tema.card }]}>
        {topArtistas.map((artista, index) => (
          <View key={index} style={[styles.itemLista, { borderBottomColor: tema.borda }]}>
            <Text style={[styles.posicao, { color: tema.primaria }]}>{index + 1}º</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nomeItem, { color: tema.texto }]} numberOfLines={1}>{artista.nome}</Text>
              <Text style={[styles.detalheItem, { color: tema.subtexto }]}>{artista.reproducoes} reproduções</Text>
            </View>
            {index === 0 && <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />}
          </View>
        ))}
      </View>

      <Text style={[styles.subtitulo, { color: tema.texto }]}>Top 5 Álbuns</Text>
      <View style={[styles.cardLista, { backgroundColor: tema.card }]}>
        {topAlbuns.map((album, index) => (
          <View key={index} style={[styles.itemLista, { borderBottomColor: tema.borda }]}>
            <Text style={[styles.posicao, { color: tema.primaria }]}>{index + 1}º</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nomeItem, { color: tema.texto }]} numberOfLines={1}>{album.nome}</Text>
              <Text style={[styles.detalheItem, { color: tema.subtexto }]}>{album.reproducoes} reproduções</Text>
            </View>
            {index === 0 && <MaterialCommunityIcons name="disc" size={24} color="#C0C0C0" />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  titulo: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitulo: { fontSize: 19, fontWeight: 'bold', marginTop: 22, marginBottom: 10, marginLeft: 5 },
  cardDestaque: { flexDirection: 'row', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 4 },
  circuloIcone: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 30, marginRight: 15 },
  infoDestaque: { flex: 1 },
  textoDestaque: { color: '#F0F0F0', fontSize: 14, fontWeight: '600' },
  valorDestaque: { color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 2 },
  cardLista: { borderRadius: 15, padding: 15, elevation: 2 },
  itemLista: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 12 },
  posicao: { fontSize: 18, fontWeight: 'bold', width: 40 },
  nomeItem: { fontSize: 16, fontWeight: 'bold' },
  detalheItem: { fontSize: 13, marginTop: 2 },
  textoVazio: { fontSize: 18, fontWeight: 'bold', marginTop: 15, textAlign: 'center' },
  textoSub: { fontSize: 14, marginTop: 5, textAlign: 'center' },
});