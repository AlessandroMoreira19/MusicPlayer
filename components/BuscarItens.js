import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext, formatarTempo } from '../App';

const ICONES_TIPO = {
  musica: 'music-note',
  album: 'album',
  artista: 'account-music',
};

export default function BuscarItens({ navigation }) {
  const { musicas, tocarAgora, abrirMenuOpcoes, tocarDeProximo, adicionarAoFimDaFila, tema } = useContext(MusicasContext);
  const [textoBusca, setTextoBusca] = useState('');
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);

  // Busca unificada: retorna músicas, álbuns únicos e artistas únicos que batem com o termo
  const obterResultadosBusca = () => {
    const termo = textoBusca.trim().toLowerCase();
    if (!termo) return [];

    const resultados = [];
    const albunsVistos = new Set();
    const artistasVistos = new Set();

    musicas.forEach((m) => {
      const titulo = m.tags?.title || m.name.replace('.mp3', '');
      const artista = m.tags?.artist || 'Artista Desconhecido';
      const album = m.tags?.album || 'Sem Álbum';

      if (titulo.toLowerCase().includes(termo) || artista.toLowerCase().includes(termo) || album.toLowerCase().includes(termo)) {
        resultados.push({
          id: `musica_${m.uri}`,
          tipo: 'musica',
          nome: titulo,
          extra: `${artista} • ${album}`,
          artwork: m.tags?.artwork,
          original: m,
        });
      }

      if (album !== 'Sem Álbum' && !albunsVistos.has(album) && album.toLowerCase().includes(termo)) {
        albunsVistos.add(album);
        const capa = musicas.find((x) => x.tags?.album === album && x.tags?.artwork)?.tags?.artwork || null;
        resultados.push({ id: `album_${album}`, tipo: 'album', nome: album, extra: 'Álbum', artwork: capa });
      }

      if (artista !== 'Artista Desconhecido' && !artistasVistos.has(artista) && artista.toLowerCase().includes(termo)) {
        artistasVistos.add(artista);
        const capa = musicas.find((x) => x.tags?.artist === artista && x.tags?.artwork)?.tags?.artwork || null;
        resultados.push({ id: `artista_${artista}`, tipo: 'artista', nome: artista, extra: 'Artista', artwork: capa });
      }
    });

    return resultados;
  };

  const resultados = obterResultadosBusca();
  const musicasEncontradas = resultados.filter((i) => i.tipo === 'musica').map((i) => i.original.uri);

  const alternarSelecao = (uri) => {
    setSelecionadas((antigas) => (antigas.includes(uri) ? antigas.filter((u) => u !== uri) : [...antigas, uri]));
  };

  const selecionarTudoNaBusca = () => {
    setSelecionadas(selecionadas.length === musicasEncontradas.length ? [] : musicasEncontradas);
  };

  const sairModoSelecao = () => {
    setModoSelecao(false);
    setSelecionadas([]);
  };

  const executarAcaoLote = (acao) => {
    acao(musicas.filter((m) => selecionadas.includes(m.uri)));
    sairModoSelecao();
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
            <MaterialCommunityIcons name={ICONES_TIPO[item.tipo] || 'music-note'} size={24} color={tema.primaria} />
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
          <Text style={[styles.duracaoTexto, { color: tema.subtexto }]}>
            {formatarTempo(item.original?.tags?.duration, '')}
          </Text>
        )}
        <MaterialCommunityIcons name="chevron-right" size={24} color={tema.subtexto} />
      </TouchableOpacity>
    );
  };

  const acoesLote = [
    { icone: 'folder-music', texto: '+ Playlist', acao: () => executarAcaoLote((itens) => abrirMenuOpcoes(itens, true)) },
    { icone: 'playlist-play', texto: 'Tocar Próximo', acao: () => executarAcaoLote(tocarDeProximo) },
    { icone: 'playlist-plus', texto: '+ Fim da Fila', acao: () => executarAcaoLote(adicionarAoFimDaFila) },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tema.bg }]}>
      <View style={styles.topoBarra}>
        <View style={styles.tituloContainer}>
          <Image source={require('../assets/mascote.png')} style={styles.mascoteIcone} />
          <Text style={[styles.titulo, { color: tema.primaria }]}>Buscar</Text>
        </View>
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
        data={resultados}
        keyExtractor={(item) => item.id}
        renderItem={renderizarItem}
        ListEmptyComponent={
          textoBusca.length > 0 ? (
            <Text style={[styles.textoCentro, { color: tema.subtexto }]}>Nenhum resultado para "{textoBusca}".</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: modoSelecao ? 110 : 20 }}
        style={styles.lista}
      />

      {modoSelecao && musicasEncontradas.length > 0 && (
        <View style={[styles.barraMultiSelecao, { backgroundColor: tema.card, borderTopColor: tema.borda }]}>
          <View style={styles.cabecalhoSelecao}>
            <Text style={[styles.contadorSelecao, { color: tema.texto }]}>
              {selecionadas.length} de {musicasEncontradas.length} música(s)
            </Text>
            <TouchableOpacity onPress={selecionarTudoNaBusca}>
              <Text style={{ color: tema.primaria, fontWeight: 'bold' }}>
                {selecionadas.length === musicasEncontradas.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.botoesMultiContainer}>
            {acoesLote.map((btn) => (
              <TouchableOpacity
                key={btn.texto}
                style={[styles.botaoMultiAcao, { backgroundColor: tema.primaria }]}
                onPress={btn.acao}
                disabled={selecionadas.length === 0}
              >
                <MaterialCommunityIcons name={btn.icone} size={18} color="#FFF" />
                <Text style={styles.textoMultiAcao}>{btn.texto}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 45 },
  topoBarra: { flexDirection: 'row', width: '90%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  tituloContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mascoteIcone: { width: 28, height: 28 },
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
  duracaoTexto: { fontSize: 12, fontWeight: 'bold', marginRight: 8 },
  textoCentro: { fontSize: 15, textAlign: 'center', marginTop: 20 },
  barraMultiSelecao: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, borderTopWidth: 1, elevation: 10 },
  cabecalhoSelecao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  contadorSelecao: { fontSize: 14, fontWeight: 'bold' },
  botoesMultiContainer: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  botaoMultiAcao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  textoMultiAcao: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});
