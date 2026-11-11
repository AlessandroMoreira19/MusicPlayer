import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, KeyboardAvoidingView } from 'react-native';
import firebase, { MusicasContext, MASCOTE, AnimarEntrada } from '../config/config';

export default function Login({ navigation }) {
  const { tema } = useContext(MusicasContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const fazerLogin = async () => {
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      // Autentica no Firebase; o onAuthStateChanged no App.js libera o acesso automaticamente
      await firebase.auth().signInWithEmailAndPassword(emailLimpo, senha);
    } catch (error) {
      const credencialInvalida =
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/invalid-email';
      setErro(credencialInvalida ? 'Email ou senha inválidos.' : error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    // Empurra o card para cima quando o teclado abre, evitando cobrir os campos
    // Referência: https://reactnative.dev/docs/keyboardavoidingview
    <KeyboardAvoidingView behavior="padding" style={[styles.container, { backgroundColor: tema.bg }]}>
      <AnimarEntrada style={[styles.card, { backgroundColor: tema.card }]}>
        <View style={[styles.bolhaMascote, { backgroundColor: tema.primariaClara }]}>
          <Image source={carregando ? MASCOTE.trabalhando : MASCOTE.fones} style={styles.mascote} />
        </View>

        <Text style={[styles.titulo, { color: tema.primaria }]}>MusicPlayer</Text>
        <Text style={[styles.subtitulo, { color: tema.subtexto }]}>
          {carregando ? 'Nyx está conectando sua conta...' : 'Olá! O Nyx está pronto para tocar suas músicas.'}
        </Text>

        {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}

        <TextInput
          style={[styles.input, { backgroundColor: tema.bg, color: tema.texto, borderColor: tema.borda }]}
          placeholder="Email"
          placeholderTextColor={tema.subtexto}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, { backgroundColor: tema.bg, color: tema.texto, borderColor: tema.borda }]}
          placeholder="Senha"
          placeholderTextColor={tema.subtexto}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.botao, { backgroundColor: tema.primaria }]} onPress={fazerLogin} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.textoBotao}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')} style={styles.link}>
          <Text style={[styles.textoLink, { color: tema.primaria }]}>Não tem uma conta? Cadastre-se</Text>
        </TouchableOpacity>
      </AnimarEntrada>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 4 },
  bolhaMascote: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  mascote: { width: 105, height: 105 },
  titulo: { fontSize: 30, fontWeight: 'bold' },
  subtitulo: { fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 22 },
  input: { width: '100%', padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 16, borderWidth: 1 },
  botao: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 4, marginBottom: 16, elevation: 2 },
  textoBotao: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  link: { marginTop: 4 },
  textoLink: { fontSize: 15, fontWeight: 'bold' },
  textoErro: { color: '#FF6B6B', marginBottom: 12, fontWeight: 'bold', textAlign: 'center' },
});
