import React, { createContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Alert, Vibration } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from 'firebase/compat/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import 'firebase/compat/auth';
import 'firebase/compat/database';

// Expo carrega automaticamente variáveis EXPO_PUBLIC_* do arquivo .env em process.env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const camposFirebaseObrigatorios = Object.entries(firebaseConfig)
  .filter(([, valor]) => !valor)
  .map(([campo]) => campo);

if (camposFirebaseObrigatorios.length > 0) {
  throw new Error(
    `Configuração do Firebase ausente: ${camposFirebaseObrigatorios.join(', ')}. Configure as variáveis EXPO_PUBLIC_FIREBASE_* no arquivo .env.`
  );
}

// Evita reinicializar o Firebase durante o Hot Reload
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);

  // No celular o Firebase Auth guarda o login só na memória por padrão (some ao fechar o app).
  // Aqui o login passa a ser salvo no AsyncStorage para continuar logado ao reabrir.
  // Referência: https://firebase.google.com/docs/auth/web/auth-state-persistence
  if (Platform.OS !== 'web') {
    try {
      initializeAuth(firebase.app(), { persistence: getReactNativePersistence(AsyncStorage) });
    } catch (e) {}
  }
}

// Contexto global para compartilhar estados entre todas as telas sem precisar passar via props
// Referência: https://react.dev/reference/react/createContext
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

// Confirmação compatível com Mobile (Alert nativo) e Web (window.confirm, já que Alert.alert é vazio no react-native-web)
// Referência: https://www.w3schools.com/jsref/met_win_confirm.asp
export const confirmarAcao = (titulo, mensagem, aoConfirmar) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
  } else {
    Alert.alert(titulo, mensagem, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: aoConfirmar },
    ]);
  }
};

// Aviso simples compatível com Mobile (Alert nativo) e Web (window.alert)
// Referência: https://www.w3schools.com/jsref/met_win_alert.asp
export const exibirAviso = (titulo, mensagem) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
};

// Aciona o motor de vibração (atuador físico do celular) para dar feedback tátil nas interações
// Referência React Native Vibration: https://reactnative.dev/docs/vibration
export const vibrar = (padrao = 35) => {
  try {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(padrao);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(padrao);
    }
  } catch (e) {}
};

// Transição suave toda vez que a aba/tela recebe foco
// Referências: https://reactnative.dev/docs/animated e https://reactnavigation.org/docs/use-is-focused/
export function AnimarEntrada({ children, style, gatilho }) {
  const focado = useIsFocused();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!focado) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [focado, gatilho]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
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
