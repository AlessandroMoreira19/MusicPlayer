import React, { createContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAsSpC_ct4IsHRJ2uOCKiHU41mi2l-V5mQ',
  authDomain: 'musicplayer-a59b6.firebaseapp.com',
  databaseURL: 'https://musicplayer-a59b6-default-rtdb.firebaseio.com',
  projectId: 'musicplayer-a59b6',
  storageBucket: 'musicplayer-a59b6.firebasestorage.app',
  messagingSenderId: '177499307503',
  appId: '1:177499307503:web:235d0c5ed2167490538a1a',
};

// Evita reinicializar o Firebase durante o Hot Reload
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Contexto e utilitários compartilhados ficam aqui para evitar ciclo de importação (Require cycle) com o App.js
export const MusicasContext = createContext();

export const MASCOTE = {
  atento: require('../assets/mascote.png'),
  feliz: require('../assets/mascote_feliz.png'),
  fones: require('../assets/mascote_fones.png'),
  curioso: require('../assets/mascote_curioso.png'),
  som: require('../assets/mascote_som.png'),
  trabalhando: require('../assets/mascote_trabalhando.png'),
  voando: require('../assets/mascote_voando.png'),
  carinho: require('../assets/mascote_carinho.png'),
  play: require('../assets/mascote_play.png'),
};

export const PALETAS_CORES = [
  { nome: 'Roxo Nyx', cor: '#6C3CE9', clara: '#EFEAFF' },
  { nome: 'Ciano Neon', cor: '#00ACC1', clara: '#E0F7FA' },
  { nome: 'Verde Spotify', cor: '#1DB954', clara: '#E6F9ED' },
  { nome: 'Azul Oceano', cor: '#0288D1', clara: '#E1F5FE' },
  { nome: 'Vermelho Crimson', cor: '#E53935', clara: '#FFEBEE' },
  { nome: 'Rosa Neon', cor: '#D81B60', clara: '#FCE4EC' },
];

// Formata segundos para "M:SS" em todas as telas do app
export const formatarTempo = (segundos, padrao = '00:00') => {
  if (!segundos) return padrao;
  const min = Math.floor(segundos / 60);
  const seg = Math.floor(segundos % 60);
  return `${min}:${seg < 10 ? '0' : ''}${seg}`;
};

// Transição rápida e fluida toda vez que a aba/tela recebe foco (sem piscar a tela)
export function AnimarEntrada({ children, style, gatilho }) {
  const focado = useIsFocused();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!focado) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [focado, gatilho]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }),
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Cabeçalho protagonista com o mascote Nyx animado flutuando suavemente
export function BannerMascote({ pose = MASCOTE.atento, titulo, subtitulo, tema, direita }) {
  const flutuar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flutuar, { toValue: -4, duration: 1400, useNativeDriver: true }),
        Animated.timing(flutuar, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[styles.bannerMascote, { backgroundColor: tema.card, borderColor: tema.borda }]}>
      <View style={[styles.circuloMascoteBanner, { backgroundColor: tema.primariaClara }]}>
        <Animated.Image source={pose} style={[styles.imgMascoteBanner, { transform: [{ translateY: flutuar }] }]} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.tituloBanner, { color: tema.primaria }]} numberOfLines={1}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[styles.subtituloBanner, { color: tema.subtexto }]} numberOfLines={1}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {direita}
    </View>
  );
}

const styles = StyleSheet.create({
  bannerMascote: { flexDirection: 'row', alignItems: 'center', width: '92%', alignSelf: 'center', padding: 12, borderRadius: 18, marginBottom: 14, borderWidth: 1, elevation: 2 },
  circuloMascoteBanner: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imgMascoteBanner: { width: 52, height: 52 },
  tituloBanner: { fontSize: 20, fontWeight: 'bold' },
  subtituloBanner: { fontSize: 12, marginTop: 2 },
});

export default firebase;
