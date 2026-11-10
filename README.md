# 🎵 MusicPlayer

<p align="center">
  <img src="./assets/mascote_fones.png" width="85" alt="Nyx Fones" />
  <img src="./assets/mascote_som.png" width="85" alt="Nyx Som" />
  <img src="./assets/mascote_voando.png" width="85" alt="Nyx Voando" />
  <img src="./assets/mascote_carinho.png" width="85" alt="Nyx Playlists" />
  <img src="./assets/mascote_play.png" width="85" alt="Nyx Play" />
</p>

## 📌 Visão Geral

O **MusicPlayer** é um reprodutor musical híbrido (*Offline-First* + Nuvem) desenvolvido em **React Native com Expo** e protagonizado pelo mascote **Nyx**.

O aplicativo permite importar arquivos `.mp3` locais do dispositivo — extraindo automaticamente **Título, Artista, Álbum, Capa embutida e Duração** diretamente dos bytes do arquivo (ID3v2) — enquanto sincroniza **Playlists** e **Estatísticas de Audição** na nuvem em tempo real com o **Firebase**.

---

## 🛠️ Tecnologias Utilizadas

* **React Native** & **Expo SDK** (`Animated`, `PanResponder`, `Vibration`)
* **React Navigation** (`@react-navigation/bottom-tabs` & `@react-navigation/native-stack`)
* **Expo Audio** (`expo-audio`) — Reprodução e controle de áudio
* **Expo Document Picker** & **Expo Image Picker** — Importação de `.mp3` e capas da galeria
* **AsyncStorage** (`@react-native-async-storage/async-storage`) — Persistência local da biblioteca, tema e estatísticas offline
* **Firebase** (`firebase/auth` & `firebase/database`) — Autenticação e banco de dados em tempo real
* **Leitor Binário ID3v2 (`ExtrairTags.js`)** — Extração nativa de metadados e capas com `Uint8Array`

---

## ✨ Funcionalidades

* **Login e Cadastro (Firebase Auth):** Autenticação por e-mail e senha com sessão persistente.
* **Reprodutor e Fila Interativa:** Controles de áudio, barra de progresso (`Slider`), animações do mascote Nyx, feedback tátil por vibração e gaveta de fila com **reordenação por arraste**.
* **Biblioteca Local:** Importação múltipla de arquivos `.mp3`, leitura automática de tags/capas ID3v2 e multisseleção em lote.
* **Playlists na Nuvem (CRUD no Firebase):** Criação, edição de nome/capa (galeria ou estilos do Nyx), reprodução normal/aleatória e remoção de músicas ou playlists.
* **Busca Unificada:** Pesquisa instantânea por **Músicas**, **Álbuns** e **Artistas**, com páginas próprias para cada álbum e artista.
* **Estatísticas:** Painel sincronizado no Firebase (`users/{uid}/estatisticas`) com o **Tempo Total de Audição** e os rankings **Top 5 Músicas, Artistas e Álbuns**.
* **Personalização:** Alternância entre **Modo Claro / Escuro** e **6 paletas de cores**.

---


## 🚀 Instalação e Execução

```bash
git clone <URL_DO_REPOSITORIO>
cd MusicPlayer
npm install
npx expo start -c
```

* **No Celular:** Escaneie o QR Code com o aplicativo **Expo Go**.
* **Na Web:** Pressione `w` no terminal.
