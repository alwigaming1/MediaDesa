// js/firebase-config.js - GANTI DENGAN KONFIGURASI ANDA
const firebaseConfig = {
  apiKey: "AIzaSyDVoXNxWAGQTXxZnazsIIJE9mwxFqqGEGE",
  authDomain: "desamedia-cf003.firebaseapp.com",
  projectId: "desamedia-cf003",
  storageBucket: "desamedia-cf003.firebasestorage.app",
  messagingSenderId: "948360857632",
  appId: "1:948360857632:web:1e8b375777da3f30e9d445",
  measurementId: "G-QY3GBVJKDZ"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase berhasil diinisialisasi');
} catch (error) {
    console.error('Error inisialisasi Firebase:', error);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log('Firebase services siap digunakan');