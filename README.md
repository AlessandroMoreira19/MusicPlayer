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

### 1. Pré-requisitos

- Node.js e npm instalados.
- Git instalado.
- Expo Go no celular (opcional, para testar no dispositivo).

### 2. Baixar o projeto e instalar dependências

```bash
git clone https://github.com/AlessandroMoreira19/MusicPlayer.git
cd MusicPlayer
npm install
```

### 3. Configurar o Firebase

As configurações do Firebase são lidas de variáveis de ambiente. **Antes de iniciar o aplicativo, crie um arquivo `.env` na raiz do projeto**, no mesmo nível do `package.json`.

Você pode copiar o modelo incluído no repositório:

**macOS / Linux:**
```bash
cp .env.example .env
```

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

Abra o arquivo `.env` e substitua os valores de exemplo pelos dados do seu aplicativo Firebase. Para encontrá-los, acesse o [Firebase Console](https://console.firebase.google.com/), abra as configurações do projeto e consulte a configuração do SDK do aplicativo Web.

O arquivo deve conter estas variáveis:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=SUA_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=SEU_PROJETO.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://SEU_PROJETO-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=SEU_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=SEU_PROJETO.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=SEU_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID=SEU_APP_ID
```

> **Importante:** nunca substitua os valores do `.env.example` pelos valores reais. Não envie o arquivo `.env` ao GitHub. Ele está listado no `.gitignore`. As variáveis `EXPO_PUBLIC_*` são incorporadas ao aplicativo e podem ser vistas por quem o instala; elas não são segredos. Proteja o Firebase com regras de segurança adequadas e nunca coloque senhas administrativas, chaves privadas ou credenciais de servidor nessas variáveis.

### 4. Iniciar o aplicativo

```bash
npx expo start -c
```

- **No celular:** escaneie o QR Code com o Expo Go.
- **Na Web:** pressione `w` no terminal.

Se alterar o arquivo `.env`, reinicie o Expo para carregar as novas variáveis.
