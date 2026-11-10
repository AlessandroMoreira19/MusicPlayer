import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import firebase, { MusicasContext, MASCOTE, AnimarEntrada } from '../config/config';

export default function Cadastro({ navigation }) {
  const { tema } = useContext(MusicasContext);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const fazerCadastro = async () => {
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      // Ao cadastrar, o Firebase já autentica o usuário e o App.js troca para a tela principal
      await firebase.auth().createUserWithEmailAndPassword(emailLimpo, senha);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setErro('Este email já está em uso.');
      } else if (error.code === 'auth/invalid-email') {
        setErro('Digite um email válido.');
      } else {
        setErro(error.message);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <AnimarEntrada style={[styles.card, { backgroundColor: tema.card }]}>
        <View style={[styles.bolhaMascote, { backgroundColor: tema.primariaClara }]}>
          <Image source={carregando ? MASCOTE.trabalhando : MASCOTE.carinho} style={styles.mascote} />
        </View>

        <Text style={[styles.titulo, { color: tema.primaria }]}>Criar Conta</Text>
        <Text style={[styles.subtitulo, { color: tema.subtexto }]}>
          Junte-se ao Nyx para salvar playlists e conquistas na nuvem.
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
          placeholder="Senha (mínimo 6 caracteres)"
          placeholderTextColor={tema.subtexto}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <TouchableOpacity style={[styles.botao, { backgroundColor: tema.primaria }]} onPress={fazerCadastro} disabled={carregando}>
          {carregando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.textoBotao}>Cadastrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={[styles.textoLink, { color: tema.primaria }]}>Já tem uma conta? Voltar ao Login</Text>
        </TouchableOpacity>
      </AnimarEntrada>
    </View>
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
