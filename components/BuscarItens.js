import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext } from '../App';

export default function BuscarItens({ navigation }) {
  const {
    musicas,
    tocarAgora,
    abrirMenuOpcoes,
    tocarDeProximo,
    adicionarAoFimDaFila,
    tema,
  } = useContext(MusicasContext);

  const [textoBusca, setTextoBusca] = useState('');
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);

  const formatarTempo = (segundos) => {
    if (!segundos) return '';
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  const obterResultadosBusca = () => {
    if (textoBusca.trim().length === 0) return [];
    const texto = textoBusca.toLowerCase();
    const resultados = [];

    musicas.forEach((m) => {
      const titulo = m.tags?.title || m.name.replace('.mp3', '');
      const artista = m.tags?.artist || 'Artista Desconhecido';
      const album = m.tags?.album || 'Sem Álbum';
      if (
        titulo.toLowerCase().includes(texto) ||
        artista.toLowerCase().includes(texto) ||
        album.toLowerCase().includes(texto)
      ) {
        resultados.push({
          id: `musica_${m.uri}`,
          tipo: 'musica',
          nome: titulo,
          extra: `${artista} • ${album}`,
          artwork: m.tags?.artwork,
          original: m,
        });
      }
    });

    const albunsUnicos = Array.from(
      new Set(musicas.map((m) => m.tags?.album).filter((a) => a && a !== 'Sem Álbum'))
    );
    albunsUnicos.forEach((album) => {
      if (album.toLowerCase().includes(texto)) {
        const musicaComCapa = musicas.find((m) => m.tags?.album === album && m.tags?.artwork);
        resultados.push({
          id: `album_${album}`,
          tipo: 'album',
          nome: album,
          extra: 'Álbum',
          artwork: musicaComCapa?.tags?.artwork || null,
        });
      }
    });

    const artistasUnicos = Array.from(
      new Set(musicas.map((m) => m.tags?.artist).filter((a) => a && a !== 'Artista Desconhecido'))
    );
    artistasUnicos.forEach((artista) => {
      if (artista.toLowerCase().includes(texto)) {
        const musicaComCapa = musicas.find((m) => m.tags?.artist === artista && m.tags?.artwork);
        resultados.push({
          id: `artista_${artista}`,
          tipo: 'artista',
          nome: artista,
          extra: 'Artista',
          artwork: musicaComCapa?.tags?.artwork || null,
        });
      }
    });

    return resultados;
  };

  const alternarSelecao = (uri) => {
    setSelecionadas((antigas) =>
      antigas.includes(uri) ? antigas.filter((u) => u !== uri) : [...antigas, uri]
    );
  };

  const selecionarTudoNaBusca = () => {
    const musicasEncontradas = obterResultadosBusca().filter((i) => i.tipo === 'musica').map((i) => i.original.uri);
    if (selecionadas.length === musicasEncontradas.length) {
      setSelecionadas([]);
    } else {
      setSelecionadas(musicasEncontradas);
    }
  };

  const obterObjetosSelecionados = () => musicas.filter((m) => selecionadas.includes(m.uri));

  const sairModoSelecao = () => {
    setModoSelecao(false);
    setSelecionadas([]);
  };

  const acaoAoClicar = (item) => {
    if (modoSelecao) {
      if (item.tipo === 'musica') alternarSelecao(item.original.uri);
      return;
    }
    if (item.tipo === 'musica') {
      tocarAgora(item.original);
      navigation.navigate('Reproduzir');
    } else if (item.tipo === 'album') {
      navigation.navigate('Album', { nomeAlbum: item.nome });
    } else if (item.tipo === 'artista') {
      navigation.navigate('Artista', { nomeArtista: item.nome });
    }
  };

  const getIcone = (tipo) => {
    if (tipo === 'musica') return 'music-note';
    if (tipo === 'album') return 'album';
    return 'account-music';
  };

  const renderizarItem = ({ item }) => {
    const estaSelecionada = item.tipo === 'musica' && selecionadas.includes(item.original.uri);

    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { backgroundColor: tema.card },
          estaSelecionada && { borderColor: tema.primaria, borderWidth: 2 },
        ]}
        onPress={() => acaoAoClicar(item)}
        onLongPress={() => item.tipo === 'musica' && !modoSelecao && abrirMenuOpcoes(item.original)}
        delayLongPress={300}
      >
        {modoSelecao && item.tipo === 'musica' && (
          <MaterialCommunityIcons
            name={estaSelecionada ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={tema.primaria}
            style={{ marginRight: 10 }}
          />
        )}

        {item.artwork ? (
          <Image source={{ uri: item.artwork }} style={styles.capaMiniatura} />
        ) : (
          <View style={[styles.capaMiniatura, { backgroundColor: tema.primariaClara }]}>
            <MaterialCommunityIcons name={getIcone(item.tipo)} size={24} color={tema.primaria} />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={[styles.nomeBusca, { color: tema.texto }]} numberOfLines={1}>
            {item.nome}
          </Text>
          <Text style={[styles.textoExtra, { color: tema.subtexto }]} numberOfLines={1}>
            {item.extra}
          </Text>
        </View>

        {item.tipo === 'musica' && (
          <Text style={{ fontSize: 12, color: tema.subtexto, fontWeight: 'bold', marginRight: 8 }}>
            {formatarTempo(item.original?.tags?.duration)}
          </Text>
        )}
        <MaterialCommunityIcons name="chevron-right" size={24} color={tema.subtexto} />
      </TouchableOpacity>
    );
  };

  const totalMusicasBusca = obterResultadosBusca().filter((i) => i.tipo === 'musica').length;

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <View style={styles.topoBarra}>
        <Text style={[styles.titulo, { color: tema.primaria }]}>Buscar</Text>
        <TouchableOpacity
          style={[styles.botaoSelecionar, { backgroundColor: modoSelecao ? tema.primaria : tema.card }]}
          onPress={() => (modoSelecao ? sairModoSelecao() : setModoSelecao(true))}
        >
          <MaterialCommunityIcons
            name="checkbox-multiple-marked-outline"
            size={20}
            color={modoSelecao ? '#FFF' : tema.primaria}
          />
          <Text style={{ color: modoSelecao ? '#FFF' : tema.primaria, fontWeight: 'bold', marginLeft: 6 }}>
            {modoSelecao ? 'Cancelar' : 'Selecionar'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.buscaContainer, { backgroundColor: tema.card }]}>
        <MaterialCommunityIcons name="magnify" size={24} color={tema.subtexto} />
        <TextInput
          style={[styles.inputBusca, { color: tema.texto }]}
          placeholder="Música, Álbum ou Artista..."
          value={textoBusca}
          onChangeText={setTextoBusca}
          placeholderTextColor={tema.subtexto}
        />
        {textoBusca.length > 0 && (
          <TouchableOpacity onPress={() => setTextoBusca('')}>
            <MaterialCommunityIcons name="close-circle" size={22} color={tema.subtexto} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={obterResultadosBusca()}
        keyExtractor={(item) => item.id}
        renderItem={renderizarItem}
        ListEmptyComponent={
          textoBusca.length > 0 ? (
            <Text style={[styles.textoCentro, { color: tema.subtexto }]}>
              Nenhum resultado para "{textoBusca}".
            </Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: modoSelecao ? 110 : 20 }}
        style={styles.lista}
      />

      {modoSelecao && totalMusicasBusca > 0 && (
        <View style={[styles.barraMultiSelecao, { backgroundColor: tema.card, borderTopColor: tema.borda }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.contadorSelecao, { color: tema.texto }]}>
              {selecionadas.length} de {totalMusicasBusca} música(s)
            </Text>
            <TouchableOpacity onPress={selecionarTudoNaBusca}>
              <Text style={{ color: tema.primaria, fontWeight: 'bold' }}>
                {selecionadas.length === totalMusicasBusca ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.botoesMultiContainer}>
            <TouchableOpacity
              style={[styles.botaoMultiAcao, { backgroundColor: tema.primaria }]}
              onPress={() => {
                abrirMenuOpcoes(obterObjetosSelecionados(), true);
                sairModoSelecao();
              }}
              disabled={selecionadas.length === 0}
            >
              <MaterialCommunityIcons name="folder-music" size={18} color="#FFF" />
              <Text style={styles.textoMultiAcao}>+ Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botaoMultiAcao, { backgroundColor: tema.primaria }]}
              onPress={() => {
                tocarDeProximo(obterObjetosSelecionados());
                sairModoSelecao();
              }}
              disabled={selecionadas.length === 0}
            >
              <MaterialCommunityIcons name="playlist-play" size={18} color="#FFF" />
              <Text style={styles.textoMultiAcao}>Tocar Próximo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botaoMultiAcao, { backgroundColor: tema.primaria }]}
              onPress={() => {
                adicionarAoFimDaFila(obterObjetosSelecionados());
                sairModoSelecao();
              }}
              disabled={selecionadas.length === 0}
            >
              <MaterialCommunityIcons name="playlist-plus" size={18} color="#FFF" />
              <Text style={styles.textoMultiAcao}>+ Fim da Fila</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 45 },
  topoBarra: { flexDirection: 'row', width: '90%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  titulo: { fontSize: 24, fontWeight: 'bold' },
  botaoSelecionar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevation: 2 },
  buscaContainer: { flexDirection: 'row', width: '90%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 15, elevation: 3 },
  inputBusca: { flex: 1, marginLeft: 10, fontSize: 16 },
  lista: { width: '100%', paddingHorizontal: 16 },
  itemContainer: { flexDirection: 'row', padding: 10, borderRadius: 12, marginBottom: 10, alignItems: 'center', elevation: 2 },
  capaMiniatura: { width: 48, height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  infoContainer: { flex: 1 },
  nomeBusca: { fontSize: 16, fontWeight: 'bold' },
  textoExtra: { fontSize: 13, marginTop: 2 },
  textoCentro: { fontSize: 15, textAlign: 'center', marginTop: 20 },
  barraMultiSelecao: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, borderTopWidth: 1, elevation: 10 },
  contadorSelecao: { fontSize: 14, fontWeight: 'bold' },
  botoesMultiContainer: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  botaoMultiAcao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  textoMultiAcao: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});