# 🎵 MusicPlayer — Reprodutor de Músicas Híbrido (Offline-First + Firebase)

Aplicativo móvel de reprodução de músicas desenvolvido em **React Native com Expo**, projetado com arquitetura **Offline-First** para leitura de arquivos `.mp3` locais, extração binária de metadados ID3v2 (Título, Artista, Álbum, Capa e Duração) e sincronização em lote na nuvem com **Firebase Authentication** e **Firebase Realtime Database**.

---

## ✨ Funcionalidades Principais

* **Autenticação de Usuários (Firebase Auth):** Login e Cadastro seguros por e-mail e senha com proteção de rotas via Stack Navigator.
* **Leitura de Metadados ID3v2 e Cache Físico de Capas:** Extração automática de Título, Artista, Álbum, Duração e Capa do Álbum (`APIC`) diretamente dos arquivos `.mp3` locais, armazenando as capas em cache no diretório do dispositivo (`expo-file-system`) para carregamento imediato em todas as abas.
* **Persistência Local de Biblioteca:** As músicas adicionadas permanecem salvas no dispositivo mesmo após fechar ou reiniciar o aplicativo, com verificação contra arquivos duplicados.
* **Busca Unificada e Inteligente:** Pesquisa em tempo real por **Músicas**, **Álbuns** e **Artistas**, com páginas dedicadas para visualização de todas as faixas de um álbum ou artista e seleção múltipla em lote.
* **Gerenciamento Completo de Playlists na Nuvem:**
  * Criação ilimitada de playlists sincronizadas no Firebase.
  * Personalização de capa da playlist via **Galeria do Dispositivo** (`expo-image-picker`) ou **Capas Pré-selecionadas (Assets)**.
  * Reprodução da playlist **Em Ordem** ou no modo **Aleatório (Shuffle)**.
  * Menu de opções (3 pontos) para **Renomear**, **Alterar Capa** ou **Apagar** a playlist.
  * Detecção de **"Música Indisponível"** caso a conta seja acessada em outro dispositivo que não possua o arquivo `.mp3` local.
* **Fila de Reprodução Interativa (Drag-and-Drop):**
  * Adição de faixas individuais ou em lote ("Tocar de próximo" ou "Adicionar ao fim da fila").
  * Gaveta modal arrastável com suporte a **reordenação de faixas por arraste** e fechamento rápido ao tocar fora.
* **Gamificação e Conquistas (Offline-First Sync):**
  * Registro local de reproduções concluídas no `AsyncStorage` e sincronização agregada em lote para o Firebase (`ServerValue.increment`).
  * Painel de estatísticas com **Total de Horas Ouvidas**, **Top 5 Músicas**, **Top 5 Artistas** e **Top 5 Álbuns**.
* **Temas e Paleta de Cores Personalizáveis:** Alternância entre **Modo Claro e Modo Escuro** e escolha entre **6 paletas de cores** com persistência local.

---

## 🛠️ Tecnologias Utilizadas

* **React Native** & **Expo SDK**
* **React Navigation** (`@react-navigation/native-stack` & `@react-navigation/bottom-tabs`)
* **Expo Audio** (`expo-audio`) — Reprodução de áudio
* **Expo File System** & **Expo Document Picker** — Gerenciamento de arquivos locais e cache de capas
* **Expo Image Picker** — Seleção de imagens de capa na galeria
* **Music Metadata** (`music-metadata`) + Parser Binário ID3v2 nativo
* **AsyncStorage** (`@react-native-async-storage/async-storage`) — Persistência offline
* **Firebase** (`firebase/auth` & `firebase/database`) — Autenticação e banco de dados NoSQL em tempo real

---

## 🚀 Como Executar o Projeto

```bash
npm install
npx expo install @react-native-async-storage/async-storage expo-audio expo-document-picker expo-file-system expo-image-picker @react-native-community/slider
npx expo start -c