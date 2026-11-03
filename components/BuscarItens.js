import React, { useState } from 'react';
import { TextInput, Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import firebase from '../config/config';
import jsmediatags from 'jsmediatags';

export default function BuscarItens() {
  const [textoBusca, setTextoBusca] = useState("");
  const [resultados, setResultados] = useState([]);

  // Array local de músicas
  /*
  const musicasFiltradas = todasAsMusicas.filter(musica =>
    musica.filename.toLowerCase().includes(textoBusca.toLowerCase())
  );
  */

  const buscar = () => {
    firebase.database().ref("notebooks") 
      .orderByChild("marca").equalTo(textoBusca)
      .once('value', snapshot => {
        let data = snapshot.val();
        if (data == null) {
          alert("Não encontrado!");
          setResultados([]);
        } else {
          let dados = Object.values(data);
          setResultados(dados);
        }
      });
  };

  return (
    <View> 
      <TextInput 
        style={estilos.input} 
        placeholder="Buscar Música"
        value={textoBusca}
        onChangeText={(texto) => setTextoBusca(texto)}
      />
      <TouchableHighlight style={estilos.botao} onPress={buscar}>
        <Text style={estilos.txtBotao}>Buscar</Text>
      </TouchableHighlight>
      
      {resultados.length > 0 ? (
        resultados.map((objeto, index) => (
          <Text key={index}>{objeto.marca} {objeto.quantidade}</Text>
        ))
      ) : null}
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