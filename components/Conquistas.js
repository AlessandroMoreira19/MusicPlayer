import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firebase, { MusicasContext, MASCOTE, AnimarEntrada, BannerMascote } from '../config/config';

function SecaoRanking({ titulo, itens, iconeDestaque, corDestaque, tema }) {
  return (
    <>
      <Text style={[styles.subtitulo, { color: tema.texto }]}>{titulo}</Text>
      <View style={[styles.cardLista, { backgroundColor: tema.card, borderColor: tema.borda }]}>
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
        <Image source={MASCOTE.voando} style={{ width: 105, height: 105, marginBottom: 12 }} />
        <ActivityIndicator size="large" color={tema.primaria} />
      </View>
    );
  }

  if (!dados) {
    return (
      <AnimarEntrada style={[styles.centro, { backgroundColor: tema.bg }]}>
        <Image source={MASCOTE.fones} style={{ width: 130, height: 130, marginBottom: 12 }} />
        <Text style={[styles.textoVazio, { color: tema.texto }]}>Ainda não há dados suficientes.</Text>
        <Text style={[styles.textoSub, { color: tema.subtexto }]}>
          Ouça algumas músicas até o fim com o Nyx para desbloquear suas estatísticas!
        </Text>
      </AnimarEntrada>
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
    <AnimarEntrada style={{ flex: 1, backgroundColor: tema.bg }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 45 }}
      >
        <BannerMascote
          pose={MASCOTE.voando}
          titulo="Conquistas e Estatísticas"
          subtitulo="Seu histórico musical acompanhado pelo Nyx"
          tema={tema}
        />

        <View style={[styles.cardDestaque, { backgroundColor: tema.primaria }]}>
          <View style={styles.circuloIcone}>
            <Image source={MASCOTE.feliz} style={{ width: 52, height: 52 }} />
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
    </AnimarEntrada>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 25 },
  subtitulo: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, marginLeft: 5 },
  cardDestaque: { flexDirection: 'row', padding: 18, borderRadius: 18, alignItems: 'center', elevation: 4 },
  circuloIcone: { backgroundColor: 'rgba(255,255,255,0.2)', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoDestaque: { flex: 1 },
  textoDestaque: { color: '#F0F0F0', fontSize: 14, fontWeight: '600' },
  valorDestaque: { color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 2 },
  cardLista: { borderRadius: 16, padding: 15, borderWidth: 1, elevation: 1 },
  itemLista: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: 12 },
  posicao: { fontSize: 18, fontWeight: 'bold', width: 40 },
  nomeItem: { fontSize: 16, fontWeight: 'bold' },
  detalheItem: { fontSize: 13, marginTop: 2 },
  textoVazio: { fontSize: 18, fontWeight: 'bold', marginTop: 6, textAlign: 'center' },
  textoSub: { fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },
});
