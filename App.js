// 1. Polyfills devem ser a primeira coisa do arquivo
import { Buffer } from 'buffer';
import process from 'process';
import { TextDecoder, TextEncoder } from 'text-encoding';

global.Buffer = global.Buffer || Buffer;
global.process = global.process || process;
global.TextDecoder = global.TextDecoder || TextDecoder;
global.TextEncoder = global.TextEncoder || TextEncoder;

// 2. Importações essenciais do React e React Navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// 3. Importação dos seus componentes
import ReproduzirItens from './components/ReproduzirItens';
import Playlists from './components/Playlists';
import BuscarItens from './components/BuscarItens';
import ListarItens from './components/ListarItens';

// 4. Instância do navegador
const Navegacao = createBottomTabNavigator();

// 5. Única declaração do componente App
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