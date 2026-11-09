import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: 'AIzaSyAsSpC_ct4IsHRJ2uOCKiHU41mi2l-V5mQ',
  authDomain: 'musicplayer-a59b6.firebaseapp.com',
  databaseURL: 'https://musicplayer-a59b6-default-rtdb.firebaseio.com',
  projectId: 'musicplayer-a59b6',
  storageBucket: 'musicplayer-a59b6.firebasestorage.app',
  messagingSenderId: '177499307503',
  appId: '1:177499307503:web:235d0c5ed2167490538a1a',
};

// Evita reinicializar o Firebase durante o Hot Reload
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
