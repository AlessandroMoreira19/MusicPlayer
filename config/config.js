// Import the functions you need from the SDKs you need
import firebase from "firebase";
import 'firebase/database';
import 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAsSpC_ct4IsHRJ2uOCKiHU41mi2l-V5mQ",
  authDomain: "musicplayer-a59b6.firebaseapp.com",
  databaseURL: "https://musicplayer-a59b6-default-rtdb.firebaseio.com",
  projectId: "musicplayer-a59b6",
  storageBucket: "musicplayer-a59b6.firebasestorage.app",
  messagingSenderId: "177499307503",
  appId: "1:177499307503:web:235d0c5ed2167490538a1a"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

export default firebase