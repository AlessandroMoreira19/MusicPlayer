import * as React from 'react';
import { TextInput, Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import firebase from '../config/config';

class BuscarItens extends React.Component {
  constructor(props) {
    super(props);
    this.marca = "";
    this.state = { notebooks: [] }
  }

  buscar() {
    firebase.database().ref("notebooks")
      .orderByChild("marca").equalTo(this.marca)
      .once('value', snapshot => {
        let data = snapshot.val();
        if (data == null) {
          alert("Nao encontrado!")
        } else {
          let dados = Object.values(data)
          this.setState({ notebooks: dados })
        }
      })
  }

  render(){
    return(
      <View> 
        <TextInput style={estilos.input} 
          placeholder="Buscar Música"
          onChangeText={(texto)=>{this.marca = texto}}
        />
        <TouchableHighlight style={estilos.botao} onPress={()=>this.buscar()}>
          <Text style={estilos.txtBotao} >{"Buscar"}</Text>
        </TouchableHighlight>
        {this.state.notebooks.length > 0 ? 
          this.state.notebooks.map( objeto => (
            <Text>{objeto.marca} {objeto.quantidade}</Text>)) : 
            null}
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

export default BuscarItens;