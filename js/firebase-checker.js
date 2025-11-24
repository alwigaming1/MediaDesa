// js/firebase-checker.js
console.log('Memeriksa inisialisasi Firebase...');

let firebaseReady = false;

// Tunggu sampai Firebase siap
const waitForFirebase = setInterval(() => {
    if (typeof firebase !== 'undefined' && firebase.app) {
        console.log('✅ Firebase siap!');
        firebaseReady = true;
        clearInterval(waitForFirebase);
        document.dispatchEvent(new Event('firebaseReady'));
    }
}, 100);

// Timeout setelah 10 detik
setTimeout(() => {
    if (!firebaseReady) {
        console.error('❌ Firebase gagal diinisialisasi dalam 10 detik');
        document.dispatchEvent(new CustomEvent('firebaseError', { 
            detail: 'Firebase gagal diinisialisasi' 
        }));
    }
}, 10000);