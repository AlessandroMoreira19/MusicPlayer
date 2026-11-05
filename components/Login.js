import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import firebase from '../config/config';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const fazerLogin = () => {
    if (!email || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    setCarregando(true);
    setErro('');

    firebase.auth().signInWithEmailAndPassword(email, senha)
      .then(() => {
        setCarregando(false);
      })
      .catch((error) => {
        setCarregando(false);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          setErro('Email ou senha inválidos.');
        } else {
          setErro(error.message);
        }
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>MusicPlayer</Text>
      
      {erro ? <Text style={styles.textoErro}>{erro}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity style={styles.botao} onPress={fazerLogin} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.textoBotao}>Entrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Cadastro')} style={styles.linkCadastro}>
        <Text style={styles.textoLink}>Não tem uma conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#D3D3D3' },
  titulo: { fontSize: 32, fontWeight: 'bold', color: 'purple', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  botao: { width: '100%', backgroundColor: 'purple', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  textoBotao: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  linkCadastro: { marginTop: 10 },
  textoLink: { color: 'purple', fontSize: 16, fontWeight: 'bold' },
  textoErro: { color: '#FF6B6B', marginBottom: 15, fontWeight: 'bold', textAlign: 'center' }
});