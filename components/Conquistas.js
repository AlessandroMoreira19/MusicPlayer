import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext } from '../App';
import firebase from '../config/config';

function SecaoRanking({ titulo, itens, iconeDestaque, corDestaque, tema }) {
  return (
    <>
      <Text style={[styles.subtitulo, { color: tema.texto }]}>{titulo}</Text>
      <View style={[styles.cardLista, { backgroundColor: tema.card }]}>
        {itens.map((item, index) => (
          <View key={index} style={[styles.itemLista, { borderBottomColor: tema.borda }]}>
            <Text style={[styles.posicao, { color: tema.primaria }]}>{index + 1}º</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.nomeItem, { color: tema.texto }]} numberOfLines={1}>
                {item.nome}
              </Text>
              <Text style={[styles.detalheItem, { color: tema.subtexto }]}>{item.detalhe}</Text>
            </View>
            {index === 0 && <MaterialCommunityIcons name={iconeDestaque} size={24} color={corDestaque} />}
          </View>
        ))}
      </View>
    </>
  );
}

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

  const topMusicas = Object.values(dados.musicas || {})
    .sort((a, b) => b.reproducoes - a.reproducoes)
    .slice(0, 5)
    .map((m) => ({ nome: m.titulo, detalhe: `${m.artista} • ${m.reproducoes} reproduções` }));

  const topArtistas = Object.entries(dados.artistas || {})
    .map(([nome, info]) => ({ nome, ...info }))
    .sort((a, b) => b.reproducoes - a.reproducoes)
    .slice(0, 5)
    .map((a) => ({ nome: a.nome, detalhe: `${a.reproducoes} reproduções` }));

  const topAlbuns = Object.entries(dados.albuns || {})
    .map(([nome, info]) => ({ nome, ...info }))
    .sort((a, b) => b.reproducoes - a.reproducoes)
    .slice(0, 5)
    .map((al) => ({ nome: al.nome, detalhe: `${al.reproducoes} reproduções` }));

  const tempoTotalSegundos = Object.values(dados.tempoMensal || {}).reduce((acc, s) => acc + s, 0);
  const tempoTotalHoras = (tempoTotalSegundos / 3600).toFixed(1);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tema.bg }]}
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 45 }}
    >
      <View style={styles.tituloTopo}>
        <Image source={require('../assets/mascote.png')} style={styles.mascoteIcone} />
        <Text style={[styles.titulo, { color: tema.primaria }]}>Conquistas e Estatísticas</Text>
      </View>

      <View style={[styles.cardDestaque, { backgroundColor: tema.primaria }]}>
        <View style={styles.circuloIcone}>
          <MaterialCommunityIcons name="clock-fast" size={32} color="white" />
        </View>
        <View style={styles.infoDestaque}>
          <Text style={styles.textoDestaque}>Tempo de Audição Total</Text>
          <Text style={styles.valorDestaque}>{tempoTotalHoras} Horas</Text>
        </View>
      </View>

      <SecaoRanking titulo="Top 5 Músicas" itens={topMusicas} iconeDestaque="star-circle" corDestaque="#1DB954" tema={tema} />
      <SecaoRanking titulo="Top 5 Artistas" itens={topArtistas} iconeDestaque="crown" corDestaque="#FFD700" tema={tema} />
      <SecaoRanking titulo="Top 5 Álbuns" itens={topAlbuns} iconeDestaque="disc" corDestaque="#C0C0C0" tema={tema} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  tituloTopo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
  mascoteIcone: { width: 32, height: 32 },
  titulo: { fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
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
