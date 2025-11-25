// js/firebase-config.js - Firebase Configuration untuk Vercel
console.log('Memuat Firebase Configuration...');

const firebaseConfig = {
  apiKey: "AIzaSyDVoXNxWAGQTXxZnazsIIJE9mwxFqqGEGE",
  authDomain: "desamedia-cf003.firebaseapp.com",
  projectId: "desamedia-cf003",
  storageBucket: "desamedia-cf003.firebasestorage.app",
  messagingSenderId: "948360857632",
  appId: "1:948360857632:web:1e8b375777da3f30e9d445",
  measurementId: "G-QY3GBVJKDZ"
};

// Initialize Firebase dengan error handling
try {
    // Cek jika Firebase sudah diinisialisasi
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase berhasil diinisialisasi');
    } else {
        firebase.app(); // jika sudah ada, gunakan yang existing
        console.log('✅ Firebase sudah diinisialisasi sebelumnya');
    }
} catch (error) {
    console.error('❌ Error inisialisasi Firebase:', error);
}

// Initialize Firebase services dengan safety check
let auth, db, storage;

try {
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
    
    // Enable offline persistence untuk Firestore
    db.enablePersistence()
      .then(() => console.log('✅ Firestore offline persistence enabled'))
      .catch(err => {
          if (err.code == 'failed-precondition') {
              console.log('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
          } else if (err.code == 'unimplemented') {
              console.log('⚠️ The current browser doesn\'t support persistence');
          }
      });
    
    console.log('✅ Firebase services siap digunakan');
} catch (error) {
    console.error('❌ Error initializing Firebase services:', error);
}

// Export untuk penggunaan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, auth, db, storage };
}
