import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MusicasContext, formatarTempo, MASCOTE, AnimarEntrada, BannerMascote, confirmarAcao, vibrar } from '../config/config';
import { extrairTags } from './ExtrairTags';

export default function ListarItens({ navigation }) {
  const {
    usuario,
    sairDaConta,
    musicas,
    setMusicas,
    tocarAgora,
    abrirMenuOpcoes,
    tocarDeProximo,
    adicionarAoFimDaFila,
    tema,
    setModalTemaVisivel,
  } = useContext(MusicasContext);

  const [carregando, setCarregando] = useState(false);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);

  // Abre o seletor de arquivos do sistema para importar um ou vários arquivos MP3
  // Referência DocumentPicker: https://docs.expo.dev/versions/latest/sdk/document-picker/
  const selecionarVariasMusicas = async () => {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (resultado.canceled) return;

      setCarregando(true);
      const listaAtualizada = [...musicas];

      for (const item of resultado.assets) {
        const idx = listaAtualizada.findIndex(
          (antiga) => antiga.uri === item.uri || antiga.name.toLowerCase() === item.name.toLowerCase()
        );

        if (idx === -1) {
          const tags = await extrairTags(item.uri, item.name);
          listaAtualizada.push({ uri: item.uri, name: item.name, tags });
        } else if (!listaAtualizada[idx].tags?.artwork || listaAtualizada[idx].tags?.artist === 'Artista Desconhecido') {
          const tags = await extrairTags(item.uri, item.name);
          listaAtualizada[idx] = {
            uri: item.uri,
            name: item.name,
            tags: { ...tags, duration: tags.duration || listaAtualizada[idx].tags?.duration || 0 },
          };
        }
      }

      setMusicas(listaAtualizada);
    } catch (erro) {
      console.warn('Erro ao selecionar documentos:', erro);
    } finally {
      setCarregando(false);
    }
  };

  // Reextrai tags ID3 e capas de todas as músicas já importadas
  const atualizarMetadadosExistentes = async () => {
    if (musicas.length === 0) return;
    setCarregando(true);
    try {
      const atualizadas = [];
      for (const item of musicas) {
        const tags = await extrairTags(item.uri, item.name);
        atualizadas.push({
          ...item,
          tags: {
            title: tags.title !== item.name.replace(/\.[^/.]+$/, '') ? tags.title : item.tags?.title || tags.title,
            artist: tags.artist !== 'Artista Desconhecido' ? tags.artist : item.tags?.artist || tags.artist,
            album: tags.album !== 'Sem Álbum' ? tags.album : item.tags?.album || tags.album,
            artwork: tags.artwork || item.tags?.artwork || null,
            duration: tags.duration || item.tags?.duration || 0,
          },
        });
      }
      setMusicas(atualizadas);
    } catch (e) {
      console.warn('Erro ao atualizar metadados:', e);
    } finally {
      setCarregando(false);
    }
  };

  const alternarItemSelecionado = (uri) => {
    setSelecionadas((antigas) => (antigas.includes(uri) ? antigas.filter((u) => u !== uri) : [...antigas, uri]));
  };

  const selecionarTudo = () => {
    setSelecionadas(selecionadas.length === musicas.length ? [] : musicas.map((m) => m.uri));
  };

  const obterObjetosSelecionados = () => musicas.filter((m) => selecionadas.includes(m.uri));

  const sairModoSelecao = () => {
    setModoSelecao(false);
    setSelecionadas([]);
  };

  const clicarItem = (item) => {
    if (modoSelecao) {
      alternarItemSelecionado(item.uri);
    } else {
      tocarAgora(item, musicas);
      navigation.navigate('Reproduzir');
    }
  };

  const removerMusicaUnica = (uri) => {
    vibrar(40);
    setMusicas((anteriores) => anteriores.filter((m) => m.uri !== uri));
  };

  const apagarSelecionadasEmLote = () => {
    confirmarAcao(
      'Apagar Músicas',
      `Deseja remover as ${selecionadas.length} músicas selecionadas da biblioteca?`,
      () => {
        vibrar(50);
        setMusicas((anteriores) => anteriores.filter((m) => !selecionadas.includes(m.uri)));
        sairModoSelecao();
      }
    );
  };

  const executarAcaoLote = (acao) => {
    acao(obterObjetosSelecionados());
    sairModoSelecao();
  };

  const renderizarItem = ({ item }) => {
    const estaSelecionada = selecionadas.includes(item.uri);
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          { backgroundColor: tema.card, borderColor: estaSelecionada ? tema.primaria : tema.borda },
          estaSelecionada && { borderWidth: 2 },
        ]}
        onPress={() => clicarItem(item)}
        onLongPress={() => !modoSelecao && abrirMenuOpcoes(item)}
        delayLongPress={300}
      >
        {modoSelecao && (
          <MaterialCommunityIcons
            name={estaSelecionada ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
            size={24}
            color={tema.primaria}
            style={{ marginRight: 10 }}
          />
        )}

        {item.tags?.artwork ? (
          <Image source={{ uri: item.tags.artwork }} style={styles.capaMiniatura} />
        ) : (
          <View style={[styles.capaMiniatura, { backgroundColor: tema.primariaClara }]}>
            <Image source={MASCOTE.fones} style={{ width: 40, height: 40 }} />
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={[styles.nomeMusica, { color: tema.texto }]} numberOfLines={1}>
            {item.tags?.title || item.name.replace('.mp3', '')}
          </Text>
          <Text style={[styles.nomeArtista, { color: tema.subtexto }]} numberOfLines={1}>
            {item.tags?.artist || 'Artista Desconhecido'} • {item.tags?.album || 'Sem Álbum'}
          </Text>
        </View>

        <Text style={[styles.duracaoTexto, { color: tema.subtexto }]}>{formatarTempo(item.tags?.duration)}</Text>

        {!modoSelecao && (
          <TouchableOpacity style={styles.botaoRemover} onPress={() => removerMusicaUnica(item.uri)}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const acoesLote = [
    { icone: 'folder-music', texto: '+ Playlist', cor: tema.primaria, acao: () => executarAcaoLote((itens) => abrirMenuOpcoes(itens, true)) },
    { icone: 'playlist-play', texto: 'Próximo', cor: tema.primaria, acao: () => executarAcaoLote(tocarDeProximo) },
    { icone: 'playlist-plus', texto: '+ Fila', cor: tema.primaria, acao: () => executarAcaoLote(adicionarAoFimDaFila) },
    { icone: 'trash-can-outline', texto: 'Apagar', cor: '#FF6B6B', acao: apagarSelecionadasEmLote },
  ];

  const botoesTopo = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <TouchableOpacity style={styles.iconeTopo} onPress={atualizarMetadadosExistentes}>
        <MaterialCommunityIcons name="refresh" size={22} color={tema.primaria} />
      </TouchableOpacity>
      {musicas.length > 0 && (
        <TouchableOpacity
          style={[styles.botaoSelecionarTopo, { backgroundColor: modoSelecao ? tema.primaria : tema.primariaClara }]}
          onPress={() => (modoSelecao ? sairModoSelecao() : setModoSelecao(true))}
        >
          <MaterialCommunityIcons
            name="checkbox-multiple-marked-outline"
            size={20}
            color={modoSelecao ? '#FFF' : tema.primaria}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.iconeTopo} onPress={() => setModalTemaVisivel(true)}>
        <MaterialCommunityIcons name="palette" size={22} color={tema.primaria} />
      </TouchableOpacity>
    </View>
  );

  return (
    <AnimarEntrada style={[styles.container, { backgroundColor: tema.bg }]}>
      <BannerMascote
        pose={carregando ? MASCOTE.trabalhando : MASCOTE.play}
        titulo="Minhas Músicas"
        subtitulo={carregando ? 'Nyx está lendo tags e capas...' : `${musicas.length} música(s) na biblioteca`}
        tema={tema}
        direita={botoesTopo}
      />

      {usuario && (
        <View style={[styles.barraConta, { backgroundColor: tema.card, borderColor: tema.borda }]}>
          <View style={styles.infoConta}>
            <MaterialCommunityIcons name="account-circle-outline" size={20} color={tema.primaria} />
            <Text style={[styles.emailConta, { color: tema.subtexto }]} numberOfLines={1}>
              {usuario.email}
            </Text>
          </View>
          <TouchableOpacity style={styles.botaoSair} onPress={sairDaConta}>
            <MaterialCommunityIcons name="logout" size={16} color="#FF6B6B" />
            <Text style={styles.textoSair}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.botao, { backgroundColor: tema.primaria }]}
        onPress={selecionarVariasMusicas}
        disabled={carregando}
      >
        {carregando ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="playlist-plus" size={24} color="white" />}
        <Text style={styles.textoBotao}>{carregando ? 'Processando tags e capas...' : 'Adicionar Músicas'}</Text>
      </TouchableOpacity>

      <FlatList
        data={musicas}
        keyExtractor={(item) => item.uri}
        renderItem={renderizarItem}
        ListEmptyComponent={
          <View style={styles.vazioContainer}>
            <Image source={MASCOTE.play} style={{ width: 115, height: 115, marginBottom: 10 }} />
            <Text style={[styles.textoCentro, { color: tema.subtexto }]}>
              Nenhuma música carregada ainda. Toque em "Adicionar Músicas" para o Nyx organizar sua biblioteca!
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: modoSelecao ? 120 : 20 }}
        style={styles.lista}
      />

      {modoSelecao && (
        <View style={[styles.barraMultiSelecao, { backgroundColor: tema.card, borderTopColor: tema.borda }]}>
          <View style={styles.cabecalhoSelecao}>
            <Text style={[styles.contadorSelecao, { color: tema.texto }]}>
              {selecionadas.length} de {musicas.length} selecionada(s)
            </Text>
            <TouchableOpacity onPress={selecionarTudo}>
              <Text style={{ color: tema.primaria, fontWeight: 'bold' }}>
                {selecionadas.length === musicas.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.botoesMultiContainer}>
            {acoesLote.map((btn) => (
              <TouchableOpacity
                key={btn.texto}
                style={[styles.botaoMultiAcao, { backgroundColor: btn.cor }]}
                onPress={btn.acao}
                disabled={selecionadas.length === 0}
              >
                <MaterialCommunityIcons name={btn.icone} size={16} color="#FFF" />
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
  iconeTopo: { padding: 6 },
  botaoSelecionarTopo: { padding: 7, borderRadius: 10 },
  barraConta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '92%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  infoConta: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 10 },
  emailConta: { fontSize: 13, fontWeight: '500', flexShrink: 1 },
  botaoSair: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255, 107, 107, 0.14)' },
  textoSair: { color: '#FF6B6B', fontSize: 12, fontWeight: 'bold' },
  botao: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 25, borderRadius: 14, alignItems: 'center', gap: 10, marginBottom: 14, width: '92%', justifyContent: 'center', elevation: 3 },
  textoBotao: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  lista: { width: '100%', paddingHorizontal: 16 },
  itemContainer: { flexDirection: 'row', padding: 10, borderRadius: 14, marginBottom: 10, alignItems: 'center', borderWidth: 1, elevation: 1 },
  capaMiniatura: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  infoContainer: { flex: 1 },
  nomeMusica: { fontSize: 15, fontWeight: 'bold' },
  nomeArtista: { fontSize: 12, marginTop: 3 },
  duracaoTexto: { fontSize: 12, fontWeight: 'bold', marginHorizontal: 8 },
  botaoRemover: { padding: 6 },
  vazioContainer: { marginTop: 35, alignItems: 'center', paddingHorizontal: 25 },
  textoCentro: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  barraMultiSelecao: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, borderTopWidth: 1, elevation: 10 },
  cabecalhoSelecao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  contadorSelecao: { fontSize: 13, fontWeight: 'bold' },
  botoesMultiContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  botaoMultiAcao: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 4 },
  textoMultiAcao: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
});
