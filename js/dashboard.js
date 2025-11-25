// js/dashboard-fixed.js - Enhanced dashboard functionality dengan Firebase
console.log('Memuat dashboard.js...');

// Variabel global
let articles = [];
let currentUser = null;

// Fungsi untuk mendapatkan konten dari editor WYSIWYG
function getEditorContent() {
    const editorContent = document.getElementById('articleContent');
    return editorContent ? editorContent.innerHTML : '';
}

// Fungsi untuk mengatur konten editor (untuk edit artikel)
function setEditorContent(html) {
    const editorContent = document.getElementById('articleContent');
    if (editorContent) {
        editorContent.innerHTML = html;
        
        // Update character counter
        const text = editorContent.innerText || '';
        const length = text.length;
        const charCounter = document.getElementById('charCounter');
        if (charCounter) {
            charCounter.textContent = `${length} karakter`;
            
            if (length > 5000) {
                charCounter.classList.add('warning');
            } else {
                charCounter.classList.remove('warning');
            }
            
            if (length > 10000) {
                charCounter.classList.add('error');
            } else {
                charCounter.classList.remove('error');
            }
        }
    }
}

// Update fungsi editArticle untuk menggunakan editor WYSIWYG
function editArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (article) {
        // Isi form dengan data artikel
        document.getElementById('articleTitle').value = article.title || '';
        document.getElementById('articleCategory').value = article.category || '';
        document.getElementById('articleStatus').value = article.status || 'draft';
        document.getElementById('articleTags').value = article.tags ? article.tags.join(', ') : '';
        
        // Set konten editor
        setEditorContent(article.content || '');
        
        // Simpan ID artikel yang sedang diedit
        localStorage.setItem('editingArticleId', articleId);
        
        // Pindah ke section new article
        showNewArticleSection();
        
        // Update judul halaman
        document.getElementById('pageTitle').textContent = 'Edit Artikel';
        
        // Tampilkan notifikasi
        showNotification('Artikel siap untuk diedit', 'info');
    }
}

// PERBAIKAN: Update fungsi saveArticle untuk menggunakan DesaMediaUtils
async function saveArticle(e) {
    if (e) e.preventDefault();
    
    try {
        showLoading('Menyimpan artikel...');
        
        const title = document.getElementById('articleTitle').value;
        const category = document.getElementById('articleCategory').value;
        const status = document.getElementById('articleStatus').value;
        const content = getEditorContent(); // Mengambil konten dari editor WYSIWYG
        const tags = document.getElementById('articleTags').value;
        
        // Validasi form
        if (!title || !category || !content) {
            throw new Error('Judul, kategori, dan konten artikel wajib diisi');
        }
        
        // Dapatkan gambar yang diupload
        let image = null;
        const fileInput = document.getElementById('articleImageFile');
        if (fileInput && fileInput.files.length > 0) {
            // PERBAIKAN: Upload gambar utama menggunakan DesaMediaUtils
            const file = fileInput.files[0];
            
            // Validasi file
            if (!DesaMediaUtils.validateImageFile(file)) {
                throw new Error('File gambar tidak valid');
            }
            
            const uploadResult = await DesaMediaUtils.uploadMainImage(file);
            if (uploadResult.success) {
                image = uploadResult.url;
                console.log('Gambar utama berhasil diupload:', image);
            } else {
                throw new Error(uploadResult.error || 'Gagal mengupload gambar utama');
            }
        } else {
            // Gunakan gambar default jika tidak ada gambar yang diupload
            image = DesaMediaUtils.getDefaultImageByCategory(category);
            console.log('Menggunakan gambar default:', image);
        }
        
        // Siapkan data artikel
        const articleData = {
            title: title.trim(),
            category,
            status,
            image,
            content: content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            author: currentUser.username || currentUser.displayName,
            authorId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            views: 0
        };
        
        // Cek apakah sedang edit atau buat baru
        const editingArticleId = localStorage.getItem('editingArticleId');
        
        let articleId;
        if (editingArticleId) {
            // Update artikel yang sudah ada
            await db.collection('articles').doc(editingArticleId).update(articleData);
            articleId = editingArticleId;
            localStorage.removeItem('editingArticleId');
            showNotification('Artikel berhasil diupdate!', 'success');
        } else {
            // Buat artikel baru
            const docRef = await db.collection('articles').add(articleData);
            articleId = docRef.id;
            showNotification('Artikel berhasil disimpan!', 'success');
        }
        
        // Reset form
        resetForm();
        
        // Reload data dashboard
        await loadDashboardData();
        
        // Kembali ke dashboard
        showDashboardSection();
        
    } catch (error) {
        console.error('Error saving article:', error);
        showError(`Gagal menyimpan artikel: ${error.message}`);
        hideLoading();
    }
}

// Update fungsi resetForm untuk mereset editor
function resetForm() {
    document.getElementById('articleForm').reset();
    clearImagePreview();
    setEditorContent(''); // Reset konten editor
    localStorage.removeItem('editingArticleId');
    document.getElementById('pageTitle').textContent = 'Tulis Artikel Baru';
    showNotification('Form berhasil direset', 'info');
}

// Fungsi untuk memuat data dashboard
async function loadDashboardData() {
    try {
        showLoading('Memuat data dashboard...');
        
        // Cek apakah user sudah login
        if (!currentUser) {
            throw new Error('User tidak terautentikasi. Silakan login ulang.');
        }
        
        // Load articles dari Firebase
        console.log('Memuat artikel untuk user:', currentUser.uid);
        const snapshot = await db.collection('articles')
            .where('authorId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();
            
        articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        
        console.log('Artikel berhasil dimuat:', articles.length);
        
        // Update UI dengan data yang dimuat
        updateDashboardUI();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError(`Gagal memuat data: ${error.message}`);
        hideLoading();
        
        // Tampilkan data placeholder
        showFallbackData();
    }
}

// Fungsi untuk memperbarui UI dashboard dengan data
function updateDashboardUI() {
    // Update stats
    updateStats();
    
    // Update recent articles table
    updateRecentArticlesTable();
    
    // Update all articles table
    updateAllArticlesTable();
}

// Fungsi untuk menampilkan data fallback jika gagal memuat
function showFallbackData() {
    // Update stats dengan nilai default
    document.getElementById('totalArticles').textContent = '0';
    document.getElementById('publishedArticles').textContent = '0';
    document.getElementById('draftArticles').textContent = '0';
    document.getElementById('totalViews').textContent = '0';
    
    // Tampilkan pesan di tabel
    const recentTable = document.getElementById('recentArticlesTable');
    const allTable = document.getElementById('allArticlesTable');
    
    if (recentTable) {
        recentTable.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Gagal memuat data artikel</p>
                    <button class="refresh-btn" onclick="loadDashboardData()">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
                </td>
            </tr>
        `;
    }
    
    if (allTable) {
        allTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Gagal memuat data artikel</p>
                    <button class="refresh-btn" onclick="loadDashboardData()">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
                </td>
            </tr>
        `;
    }
}

// Fungsi untuk memperbarui statistik
function updateStats() {
    const totalArticles = articles.length;
    const publishedArticles = articles.filter(article => article.status === 'published').length;
    const draftArticles = articles.filter(article => article.status === 'draft').length;
    const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
    
    // Update elemen statistik
    document.getElementById('totalArticles').textContent = totalArticles;
    document.getElementById('publishedArticles').textContent = publishedArticles;
    document.getElementById('draftArticles').textContent = draftArticles;
    document.getElementById('totalViews').textContent = totalViews;
}

// Fungsi untuk memperbarui tabel artikel terbaru
function updateRecentArticlesTable() {
    const tableBody = document.getElementById('recentArticlesTable');
    if (!tableBody) return;
    
    // Ambil 5 artikel terbaru
    const recentArticles = articles.slice(0, 5);
    
    if (recentArticles.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>Belum ada artikel</p>
                    <button class="btn" onclick="showNewArticleSection()">
                        <i class="fas fa-plus"></i> Buat Artikel Pertama
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = recentArticles.map(article => `
        <tr>
            <td>${article.title || 'Judul tidak tersedia'}</td>
            <td>${article.category || 'Tidak ada kategori'}</td>
            <td><span class="status status-${article.status}">${getStatusText(article.status)}</span></td>
            <td>${formatDate(article.createdAt)}</td>
            <td class="action-buttons">
                <button class="action-btn view-btn" onclick="viewArticle('${article.id}')" title="Lihat">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editArticle('${article.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteArticle('${article.id}')" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Fungsi untuk memperbarui tabel semua artikel
function updateAllArticlesTable() {
    const tableBody = document.getElementById('allArticlesTable');
    if (!tableBody) return;
    
    if (articles.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>Belum ada artikel</p>
                    <button class="btn" onclick="showNewArticleSection()">
                        <i class="fas fa-plus"></i> Buat Artikel Pertama
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = articles.map(article => `
        <tr>
            <td>${article.title || 'Judul tidak tersedia'}</td>
            <td>${article.category || 'Tidak ada kategori'}</td>
            <td><span class="status status-${article.status}">${getStatusText(article.status)}</span></td>
            <td>${formatDate(article.createdAt)}</td>
            <td>${article.views || 0}</td>
            <td class="action-buttons">
                <button class="action-btn view-btn" onclick="viewArticle('${article.id}')" title="Lihat">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editArticle('${article.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteArticle('${article.id}')" title="Hapus">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Fungsi utilitas
function getStatusText(status) {
    const statusMap = {
        'draft': 'Draft',
        'published': 'Dipublikasi',
        'review': 'Review'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return 'Tanggal tidak valid';
    }
}

// Fungsi untuk menampilkan section dashboard
function showDashboardSection() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('[data-section="dashboard"]').classList.add('active');
    
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Dashboard Penulis';
}

// Fungsi untuk menampilkan section artikel baru
function showNewArticleSection() {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('[data-section="new-article"]').classList.add('active');
    
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.style.display = 'none';
    });
    
    document.getElementById('new-article-section').style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Tulis Artikel Baru';
}

// Fungsi untuk melihat artikel
function viewArticle(articleId) {
    localStorage.setItem('currentArticle', articleId);
    window.open('article.html', '_blank');
}

// Fungsi untuk menghapus artikel
async function deleteArticle(articleId) {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
        try {
            showLoading('Menghapus artikel...');
            
            await db.collection('articles').doc(articleId).delete();
            
            // Hapus dari array lokal
            articles = articles.filter(a => a.id !== articleId);
            
            // Perbarui UI
            updateDashboardUI();
            
            hideLoading();
            showNotification('Artikel berhasil dihapus!', 'success');
        } catch (error) {
            console.error('Error deleting article:', error);
            hideLoading();
            showError('Gagal menghapus artikel: ' + error.message);
        }
    }
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    // Gunakan DesaMediaUtils jika tersedia, atau buat notifikasi sederhana
    if (typeof DesaMediaUtils !== 'undefined' && DesaMediaUtils.showNotification) {
        DesaMediaUtils.showNotification(message, type);
    } else {
        alert(message);
    }
}

// Fungsi logout
async function logout() {
    try {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            showLoading('Logging out...');
            
            if (typeof auth !== 'undefined') {
                await auth.signOut();
            }
            
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error logging out:', error);
        // Tetap redirect ke login meskipun ada error
        window.location.href = 'login.html';
    }
}

// Inisialisasi dashboard
async function initializeDashboard() {
    try {
        showLoading('Menginisialisasi dashboard...');
        
        // Cek apakah Firebase tersedia
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase tidak terdeteksi. Pastikan file firebase-config.js dimuat dengan benar.');
        }
        
        // Cek autentikasi user
        const user = await new Promise((resolve, reject) => {
            if (!auth) {
                reject(new Error('Firebase Auth tidak tersedia'));
                return;
            }
            
            const unsubscribe = auth.onAuthStateChanged(user => {
                unsubscribe();
                resolve(user);
            }, reject);
        });
        
        if (!user) {
            throw new Error('User tidak terautentikasi. Silakan login terlebih dahulu.');
        }
        
        // Dapatkan data user dari Firestore
        let userData = {};
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                userData = userDoc.data();
            }
        } catch (error) {
            console.error('Error getting user data:', error);
        }
        
        // Simpan info user
        currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || userData.name || user.email.split('@')[0],
            username: userData.username || user.email.split('@')[0],
            ...userData
        };
        
        // Update info user di UI
        document.getElementById('userName').textContent = currentUser.displayName;
        document.getElementById('userAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
        
        console.log('User authenticated:', currentUser);
        
        // Setup navigation
        setupNavigation();
        
        // Setup form handlers
        setupForms();
        
        // Load data dashboard
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showError(`Gagal menginisialisasi dashboard: ${error.message}`);
        hideLoading();
        
        // Tampilkan pesan error yang lebih detail
        setTimeout(() => {
            if (!currentUser) {
                showError('Tidak dapat terhubung ke sistem. Silakan refresh halaman atau login ulang.');
            }
        }, 2000);
    }
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('[id$="-section"]');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionName = this.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show selected section
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            
            // Update page title
            updatePageTitle(sectionName);
            
            // Load profile data jika section profile
            if (sectionName === 'profile') {
                setTimeout(() => {
                    if (typeof loadProfileData === 'function') {
                        loadProfileData();
                    }
                }, 100);
            }
        });
    });
}

// Update page title berdasarkan section
function updatePageTitle(sectionName) {
    const titles = {
        'dashboard': 'Dashboard Penulis',
        'articles': 'Artikel Saya',
        'new-article': 'Tulis Artikel Baru',
        'profile': 'Profil Saya'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || 'Dashboard';
    }
}

// Setup form handlers
function setupForms() {
    // Article form
    const articleForm = document.getElementById('articleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveArticle(e);
        });
    }
    
    // Profile form sudah diatur di dashboard.html
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard initialized');
    initializeDashboard();
});

// Make functions globally available
window.addTag = addTag;
window.showNewArticleSection = showNewArticleSection;
window.resetForm = resetForm;
window.viewArticle = viewArticle;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.logout = logout;
window.loadDashboardData = loadDashboardData;
window.hideError = hideError;
window.showDashboardSection = showDashboardSection;

// Utility functions untuk kompatibilitas
window.showError = showError;
window.showLoading = showLoading;
window.hideLoading = hideLoading;