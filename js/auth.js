// auth.js - Enhanced authentication system dengan Firebase ready check
console.log('Memuat Firebase Authentication...');

let authInitialized = false;

// Tunggu sampai Firebase siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, menunggu Firebase siap...');
    
    // Listen untuk event Firebase ready
    document.addEventListener('firebaseReady', initializeAuth);
    document.addEventListener('firebaseError', handleFirebaseError);
    
    // Fallback: check manually setelah 2 detik
    setTimeout(() => {
        if (!authInitialized && typeof auth !== 'undefined') {
            initializeAuth();
        }
    }, 2000);
});

function handleFirebaseError(event) {
    console.error('Firebase error:', event.detail);
    showEmergencyAuth();
}

function initializeAuth() {
    if (authInitialized) return;
    
    console.log('Menginisialisasi Firebase Auth...');
    
    // Check if Firebase is initialized
    if (typeof auth === 'undefined' || !auth) {
        console.error('Firebase auth belum diinisialisasi!');
        showEmergencyAuth();
        return;
    }
    
    authInitialized = true;
    
    // Check auth state - HANYA untuk logging, tidak untuk redirect
    auth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
        
        // JANGAN redirect dari halaman login
        // Biarkan proses login yang handle redirect sendiri
        
        // Untuk halaman dashboard, jika user null, redirect ke login
        if (!user && window.location.pathname.includes('dashboard.html')) {
            console.log('User logout di dashboard, redirect ke login');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        }
    });
    
    // Setup login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleFirebaseLogin);
        console.log('Login form event listener ditambahkan');
        
        // Enable form
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        }
    } else {
        console.error('Login form tidak ditemukan!');
    }
    
    // Add debug info to login page
    addDebugInfo();
}

function addDebugInfo() {
    const debugDiv = document.createElement('div');
    debugDiv.style.cssText = `
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
        font-size: 0.875rem;
        color: #6c757d;
    `;
    debugDiv.innerHTML = `
        <h4 style="margin: 0 0 0.5rem 0; color: #495057;">Status Sistem:</h4>
        <div id="debugInfo">Memeriksa Firebase...</div>
        <div style="margin-top: 0.5rem;">
            <button onclick="createDemoAccounts()" style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
                Buat Akun Demo
            </button>
            <button onclick="useEmergencyAuth()" style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Mode Darurat
            </button>
        </div>
    `;
    
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.appendChild(debugDiv);
        
        // Update debug info setiap detik
        const updateDebugInfo = () => {
            const debugInfo = document.getElementById('debugInfo');
            if (debugInfo) {
                debugInfo.innerHTML = `
                    Firebase: ${typeof firebase !== 'undefined' ? '✅ Loaded' : '❌ Missing'}<br>
                    Auth Service: ${auth ? '✅ Ready' : '❌ Not Ready'}<br>
                    Firestore: ${db ? '✅ Ready' : '❌ Not Ready'}<br>
                    Current User: ${auth?.currentUser ? auth.currentUser.email : 'None'}<br>
                    Project: ${firebaseConfig?.projectId || 'Checking...'}
                `;
            }
        };
        
        updateDebugInfo();
        setInterval(updateDebugInfo, 2000);
    }
}

async function handleFirebaseLogin(e) {
    e.preventDefault();
    console.log('Login attempt started...');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showError('Username dan password harus diisi');
        return;
    }
    
    // Untuk demo, gunakan email format
    const email = `${username}@desamedia.id`;
    
    console.log('Login attempt:', { username, email });
    
    try {
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful:', userCredential.user);
        await loginFirebaseSuccess(userCredential.user, username);
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Reset button state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Masuk';
        submitBtn.disabled = false;
        
        handleFirebaseLoginError(error);
    }
}

async function loginFirebaseSuccess(user, username) {
    try {
        console.log('Processing login success for user:', user.uid);
        
        // Get user data from Firestore
        let userData = {};
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                userData = userDoc.data();
                console.log('User data found in Firestore:', userData);
            } else {
                console.log('No user data in Firestore, creating default...');
                // Create default user data
                userData = {
                    username: username,
                    email: user.email,
                    role: username === 'editor' ? 'editor' : 'penulis',
                    name: username === 'editor' ? 'Editor Utama' : 'Penulis Desa',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isDemo: true
                };
                await db.collection('users').doc(user.uid).set(userData);
            }
        } catch (firestoreError) {
            console.error('Error accessing Firestore:', firestoreError);
            // Use default data if Firestore fails
            userData = {
                username: username,
                role: username === 'editor' ? 'editor' : 'penulis',
                name: username === 'editor' ? 'Editor Utama' : 'Penulis Desa'
            };
        }
        
        const userInfo = {
            uid: user.uid,
            username: username,
            email: user.email,
            role: userData.role || 'penulis',
            name: userData.name || username,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userInfo));
        console.log('User info saved to localStorage:', userInfo);
        
        // Show success message
        showSuccess(`Login berhasil! Selamat datang ${userInfo.role === 'editor' ? 'Editor' : 'Penulis'} ${username}`);
        
        // Tunggu sebentar sebelum redirect
        setTimeout(() => {
            console.log('Redirecting to dashboard...');
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Error in login success process:', error);
        showError('Login berhasil tetapi gagal memuat data profil: ' + error.message);
    }
}

function handleFirebaseLoginError(error) {
    console.error('Login error details:', error);
    
    let message = 'Terjadi error saat login';
    let details = '';
    
    switch (error.code) {
        case 'auth/user-not-found':
            message = 'User tidak ditemukan';
            details = 'Akun demo belum dibuat. Klik "Buat Akun Demo" terlebih dahulu.';
            break;
        case 'auth/wrong-password':
            message = 'Password salah';
            details = 'Gunakan password: password123';
            break;
        case 'auth/invalid-email':
            message = 'Format email tidak valid';
            break;
        case 'auth/too-many-requests':
            message = 'Terlalu banyak percobaan login';
            details = 'Coba lagi nanti atau reset password.';
            break;
        case 'auth/network-request-failed':
            message = 'Koneksi jaringan gagal';
            details = 'Periksa koneksi internet Anda.';
            break;
        default:
            details = error.message;
    }
    
    showError(`${message}${details ? '<br><small>' + details + '</small>' : ''}`);
}

// Enhanced auth check untuk halaman yang membutuhkan login
async function checkFirebaseAuth() {
    return new Promise((resolve, reject) => {
        if (!auth) {
            reject(new Error('Firebase auth tidak tersedia'));
            return;
        }
        
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); // Stop listener setelah dapat hasil
            
            if (user) {
                try {
                    console.log('User authenticated:', user.email);
                    
                    // Get user data dari Firestore
                    let userData = {};
                    try {
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            userData = userDoc.data();
                        }
                    } catch (error) {
                        console.error('Error getting user data:', error);
                    }
                    
                    const userInfo = {
                        uid: user.uid,
                        username: user.email.split('@')[0],
                        email: user.email,
                        role: userData.role || 'penulis',
                        name: userData.name || user.email.split('@')[0]
                    };
                    
                    localStorage.setItem('currentUser', JSON.stringify(userInfo));
                    resolve(userInfo);
                    
                } catch (error) {
                    console.error('Error in auth process:', error);
                    reject(error);
                }
            } else {
                console.log('No user, redirect to login');
                window.location.href = 'login.html';
                reject(new Error('User not authenticated'));
            }
        }, (error) => {
            console.error('Auth state change error:', error);
            reject(error);
        });
    });
}

// Create demo accounts
async function createDemoAccounts() {
    console.log('Creating demo accounts...');
    
    if (!auth) {
        showError('Firebase auth tidak tersedia. Tidak dapat membuat akun demo.');
        return;
    }
    
    const demoAccounts = [
        { username: 'penulis', password: 'password123', role: 'penulis', name: 'Penulis Desa' },
        { username: 'editor', password: 'password123', role: 'editor', name: 'Editor Utama' }
    ];
    
    const results = [];
    
    for (const account of demoAccounts) {
        const email = `${account.username}@desamedia.id`;
        
        try {
            // Try to create user
            const userCredential = await auth.createUserWithEmailAndPassword(email, account.password);
            const user = userCredential.user;
            
            // Save user data to Firestore
            await db.collection('users').doc(user.uid).set({
                username: account.username,
                email: email,
                role: account.role,
                name: account.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isDemo: true
            });
            
            results.push(`✅ ${account.username} berhasil dibuat`);
            console.log(`Demo account created: ${account.username}`);
            
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                results.push(`✅ ${account.username} sudah ada`);
                console.log(`Demo account already exists: ${account.username}`);
            } else {
                results.push(`❌ ${account.username}: ${error.message}`);
                console.error(`Error creating demo account ${account.username}:`, error);
            }
        }
    }
    
    showSuccess(`
        <strong>Hasil Pembuatan Akun Demo:</strong><br>
        ${results.join('<br>')}
        <br><br>
        <strong>Info Login:</strong><br>
        • penulis / password123<br>
        • editor / password123
    `);
}

// Emergency auth fallback
function showEmergencyAuth() {
    const emergencyDiv = document.createElement('div');
    emergencyDiv.style.cssText = `
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        color: #856404;
    `;
    emergencyDiv.innerHTML = `
        <h4 style="margin: 0 0 0.5rem 0; color: #856404;">⚠️ Mode Darurat</h4>
        <p style="margin: 0 0 0.5rem 0;">Firebase tidak dapat terhubung. Gunakan mode darurat untuk login.</p>
        <button onclick="useEmergencyAuth()" style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Aktifkan Mode Darurat
        </button>
    `;
    
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.appendChild(emergencyDiv);
    }
}

function useEmergencyAuth() {
    localStorage.setItem('emergencyMode', 'true');
    showSuccess('Mode darurat diaktifkan! Sekarang Anda bisa login tanpa Firebase.');
    
    // Refresh halaman
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// Logout function
async function firebaseLogout() {
    try {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            await auth.signOut();
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error logout:', error);
        window.location.href = 'login.html';
    }
}

// Utility functions for notifications
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        animation: slideInRight 0.3s ease;
    `;
    
    if (type === 'error') {
        notification.style.background = '#e53e3e';
    } else if (type === 'success') {
        notification.style.background = '#38a169';
    } else {
        notification.style.background = '#3182ce';
    }
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <div>${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Make functions globally available
window.logout = firebaseLogout;
window.checkAuth = checkFirebaseAuth;
window.createDemoAccounts = createDemoAccounts;
window.useEmergencyAuth = useEmergencyAuth;
window.showError = showError;
window.showSuccess = showSuccess;