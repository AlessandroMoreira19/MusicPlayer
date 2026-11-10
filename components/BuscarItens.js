import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext, formatarTempo, MASCOTE, AnimarEntrada, BannerMascote } from '../config/config';

const POSES_TIPO = {
  musica: MASCOTE.fones,
  album: MASCOTE.som,
  artista: MASCOTE.atento,
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
          { backgroundColor: tema.card, borderColor: estaSelecionada ? tema.primaria : tema.borda },
          estaSelecionada && { borderWidth: 2 },
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
            <Image source={POSES_TIPO[item.tipo] || MASCOTE.fones} style={{ width: 40, height: 40 }} />
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

  const botaoSelecionarTopo = (
    <TouchableOpacity
      style={[styles.botaoSelecionar, { backgroundColor: modoSelecao ? tema.primaria : tema.primariaClara }]}
      onPress={() => (modoSelecao ? sairModoSelecao() : setModoSelecao(true))}
    >
      <MaterialCommunityIcons
        name="checkbox-multiple-marked-outline"
        size={18}
        color={modoSelecao ? '#FFF' : tema.primaria}
      />
      <Text style={{ color: modoSelecao ? '#FFF' : tema.primaria, fontWeight: 'bold', fontSize: 12, marginLeft: 4 }}>
        {modoSelecao ? 'Cancelar' : 'Selecionar'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <AnimarEntrada style={[styles.container, { backgroundColor: tema.bg }]}>
      <BannerMascote
        pose={MASCOTE.curioso}
        titulo="Buscar"
        subtitulo="Procure músicas, álbuns e artistas"
        tema={tema}
        direita={botaoSelecionarTopo}
      />

      <View style={[styles.buscaContainer, { backgroundColor: tema.card, borderColor: tema.borda }]}>
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
          <View style={styles.vazioContainer}>
            <Image source={MASCOTE.curioso} style={{ width: 115, height: 115, marginBottom: 8 }} />
            <Text style={[styles.textoCentro, { color: tema.subtexto }]}>
              {textoBusca.trim().length > 0
                ? `Nyx procurou por toda parte, mas não achou nada para "${textoBusca}".`
                : 'Digite algo acima para o Nyx procurar na sua biblioteca!'}
            </Text>
          </View>
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
    </AnimarEntrada>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 45 },
  botaoSelecionar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  buscaContainer: { flexDirection: 'row', width: '92%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginBottom: 14, borderWidth: 1, elevation: 2 },
  inputBusca: { flex: 1, marginLeft: 10, fontSize: 16 },
  lista: { width: '100%', paddingHorizontal: 16 },
  itemContainer: { flexDirection: 'row', padding: 10, borderRadius: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, elevation: 1 },
  capaMiniatura: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  infoContainer: { flex: 1 },
  nomeBusca: { fontSize: 16, fontWeight: 'bold' },
  textoExtra: { fontSize: 13, marginTop: 2 },
  duracaoTexto: { fontSize: 12, fontWeight: 'bold', marginRight: 8 },
  vazioContainer: { alignItems: 'center', marginTop: 35, paddingHorizontal: 25 },
  textoCentro: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  barraMultiSelecao: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, borderTopWidth: 1, elevation: 10 },
  cabecalhoSelecao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  contadorSelecao: { fontSize: 14, fontWeight: 'bold' },
  botoesMultiContainer: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  botaoMultiAcao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
  textoMultiAcao: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
});
