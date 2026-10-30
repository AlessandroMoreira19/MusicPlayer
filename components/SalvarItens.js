import * as React from 'react';
import { TextInput, Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import firebase from '../config/config';

class SalvarItens extends React.Component {
  constructor(props) {
    super(props);
    this.marca = "";
    this.quantidade = 0;
  }
  salvar() {
    firebase.database().ref('/notebooks').push({
    marca: this.marca,
    quantidade: this.quantidade
  })
  alert("Playlist salva!")
}
 
render(){
    return(
      <View> 
        <TextInput style={estilos.input} 
          placeholder="Nome da Música"
          onChangeText={(texto)=>{this.marca = texto}}
        />
        <TextInput style={estilos.input} 
          placeholder="Quantidade"
          onChangeText={(texto)=>{this.quantidade = texto}}
        />
        <TouchableHighlight style={estilos.botao} onPress={()=>this.salvar()}>
          <Text  style={estilos.txtBotao} >{"Adicionar"}</Text>
        </TouchableHighlight>
      </View>
    )
  }
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

export default SalvarItens;