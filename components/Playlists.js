import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import firebase from '../config/config';
import jsmediatags from 'jsmediatags';

export default function Playlists() {
  const [nomeMusica, setNomeMusica] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const extrairTags = (uriDoArquivo) => {
    jsmediatags.read(uriDoArquivo, {
      onSuccess: function(tag) {
        const { title, artist, album, year, picture } = tag.tags;
        // O 'picture' vem como um array de bytes, você precisará convertê-lo para base64 para exibir em uma <Image>
      },
      onError: function(error) {
        console.log('Erro ao ler tags: ', error.type);
      }
    });
  };

  const salvar = () => {
    firebase.database().ref('/playlists').push({
      marca: nomeMusica,
      quantidade: quantidade
    });
    alert("Playlist salva!");

    setNomeMusica("");
    setQuantidade("");
  };

  return (
    <View> 
      <TextInput 
        style={estilos.input} 
        placeholder="Nome da Música"
        value={nomeMusica}
        onChangeText={(texto) => setNomeMusica(texto)}
      />
      <TextInput 
        style={estilos.input} 
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={(texto) => setQuantidade(texto)}
      />
      <TouchableHighlight style={estilos.botao} onPress={salvar}>
        <Text style={estilos.txtBotao}>Adicionar</Text>
      </TouchableHighlight>
    </View>
  );
}

const estilos = StyleSheet.create({
  txtBotao: {
    color: "black",
    fontSize: 25,
    alignSelf: "center"
  },
  botao: {
    height: 50,
    borderWidth: 1,
    borderColor: 'gray',
    backgroundColor: "cyan",
    margin: 10,
    borderRadius: 8,
    padding: 5,
  },
  input: {
    height: 50,
    padding: 5,
    fontSize: 25,
    borderColor: 'gray',
    borderWidth: 1,
    margin: 10,
    borderRadius: 8
  }
});