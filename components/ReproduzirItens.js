import React, { useState, useEffect } from 'react';
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
// import Slider from '@react-native-community/slider';
import { Slider } from '@miblanchard/react-native-slider';
import { Audio } from 'expo-av';


function ReproduzirItens() {
  const [posicaoAtual, setPosicaoAtual] = useState(0);
  const [duracaoTotal, setDuracaoTotal] = useState(0);
  const [soundInstancia, setSoundInstancia] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const tocarMusica = async (uriDaMusica) => {
    if (soundInstancia) {
      await soundInstancia.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: uriDaMusica },
      { shouldPlay: true }
    );

    setSoundInstancia(sound);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        setDuracaoTotal(status.durationMillis);
        setPosicaoAtual(status.positionMillis);
      }
    });
  };

  const alternarPlay = () => {
    const novoEstado = !isPlaying;
    setIsPlaying(novoEstado);
    console.log("Está tocando: ", novoEstado);
  };

  
  useEffect(() => {
    return soundInstancia
      ? () => { soundInstancia.unloadAsync(); }
      : undefined;
  }, [soundInstancia]);

  return (
    <View style={styles.container}>
      <View style = {styles.capa}>

      </View>
      <View style = {styles.containerSlider}>
        <Slider style = {styles.slider}
          value={posicaoAtual}
          minimumValue={0}
          maximumValue={duracaoTotal}
          onSlidingComplete={async (valor) => {
            if (soundInstancia) {
              await soundInstancia.setPositionAsync(valor[0]);
            }
          }}
        />
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
