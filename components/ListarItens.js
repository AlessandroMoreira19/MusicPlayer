import * as React from 'react';
import { Text, View, FlatList, TextInput, TouchableHighlight, StyleSheet } from 'react-native';
import firebase from '../config/config';

class ListarItens extends React.Component {
  constructor(props){
    super(props);
    this.marca = ""
    this.quantidade = 0
    this.state = {
      notebooks: []
    }
  }

  componentDidMount() {
    firebase.database().ref("notebooks").on('value', snapshot => {
      let data = snapshot.val();
      let dados = data ? Object.values(data) : []
      this.setState({ notebooks: dados })
    })
  }

  render(){
    return(
      <View>
      {this.state.notebooks.length > 0 ? 
      <FlatList
        data = {this.state.notebooks}
        renderItem= {( {item} ) => 
        <View>
          <Text>{item.marca} {item.quantidade}</Text>
        </View>} /> : null }
      </View>
    )
  }
}



export default ListarItens;