import React, { useState } from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TouchableHighlight,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';

function ReproduzirItens() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0)

  const alternarPlay = () => {
    const novoEstado = !isPlaying;
    setIsPlaying(novoEstado);
    console.log("Está tocando: ", novoEstado);
  };

  return (
    <View style={styles.container}>
      <View style = {styles.capa}>

      </View>
      <View style = {styles.containerSlider}>
        <Slider style={styles.slider} minimumValue={0} maximumValue={100}
        value={time} onValueChange={setTime}
        minimumTrackTintColor="black" thumbTintColor="blue" />
      </View>
      <View style={styles.containerControles}>
        <Pressable
          style={({ pressed }) => [
            styles.controles,
            pressed && styles.botaoPressionado,
          ]}
          onPress={() => console.log('Anterior')}>
          <MaterialCommunityIcons
            name="skip-previous"
            size={24}
            color="black"
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.pause,
            pressed && styles.botaoPressionado,
          ]}
          onPress={alternarPlay}>    
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="black"
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.controles,
            pressed && styles.botaoPressionado, 
          ]}
          onPress={() => console.log('Próximo')}
          onLongPress={() => console.log('Pressao longa (500ms)')}>
          <MaterialCommunityIcons name="skip-next" size={24} color="black" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D3D3D3' },
  containerControles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  containerSlider: {
    width: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capa: {
    backgroundColor: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    width: 300,
    height: 300,
    borderRadius: 40,
    transform: [{ translateY: -10 }],
  },
  pause: {
    backgroundColor: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    width: 70,
    height: 70,
    borderRadius: 35,
    transform: [{ translateY: 45 }],
  },
  controles: {
    backgroundColor: 'purple',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    width: 50,
    height: 50,
    borderRadius: 30,
    transform: [{ translateY: 45 }],
  },
  botaoPressionado: {
    backgroundColor: '#6c3483',
    transform: [{ translateY: 45 }, { scale: 0.85 }],
  },
  slider: { width:'100%', height:40 },
});

export default ReproduzirItens;
