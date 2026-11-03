import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ReproduzirItens from './components/ReproduzirItens';
import Playlists from './components/Playlists';
import BuscarItens from './components/BuscarItens';
import ListarItens from './components/ListarItens';

const Navegacao = createBottomTabNavigator();

class App extends React.Component {
  render() {
    return (
      <NavigationContainer>
        <Navegacao.Navigator>
          <Navegacao.Screen name="Reproduzir" component={ReproduzirItens} />
          <Navegacao.Screen name="Playlists" component={Playlists} />
          <Navegacao.Screen name="Buscar" component={BuscarItens} />
          <Navegacao.Screen name="Listar" component={ListarItens} />
        </Navegacao.Navigator>
      </NavigationContainer>
    );
  }
}

export default App;
