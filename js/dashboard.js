// dashboard.js - Enhanced dashboard functionality dengan Firebase
console.log('Memuat dashboard.js...');

// Deklarasi variabel global
let articles = [];
let currentUser = null;

// Firebase article functions
async function saveArticleToFirebase(articleData) {
    try {
        console.log('Menyimpan artikel ke Firebase:', articleData);
        
        const user = await checkAuth();
        
        const article = {
            title: articleData.title,
            category: articleData.category,
            status: articleData.status,
            image: articleData.image,
            content: articleData.content,
            tags: articleData.tags,
            author: user.username,
            authorId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            views: 0,
            readTime: articleData.readTime,
            excerpt: articleData.excerpt || articleData.content.substring(0, 150) + '...'
        };
        
        console.log('Data artikel yang akan disimpan:', article);
        
        const docRef = await db.collection('articles').add(article);
        console.log('Article saved with ID:', docRef.id);
        
        return docRef.id;
    } catch (error) {
        console.error('Error saving article to Firebase:', error);
        throw error;
    }
}

async function getUserArticlesFromFirebase(userId) {
    try {
        let snapshot;
        let hasOrderBy = false;

        try {
            // Coba query dengan orderBy
            snapshot = await db.collection('articles')
                .where('authorId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            hasOrderBy = true;
            console.log('Query dengan orderBy berhasil');
        } catch (error) {
            // Jika error karena index belum dibuat, ambil tanpa orderBy
            if (error.code === 'failed-precondition') {
                console.warn('Index belum dibuat, mengambil data tanpa orderBy...');
                snapshot = await db.collection('articles')
                    .where('authorId', '==', userId)
                    .get();
                hasOrderBy = false;
            } else {
                console.error('Error lain saat query:', error);
                throw error;
            }
        }
            
        let articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));

        // Jika tidak menggunakan orderBy, lakukan sorting manual
        if (!hasOrderBy) {
            console.log('Melakukan sorting manual...');
            articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        console.log(`Berhasil memuat ${articles.length} artikel`);
        return articles;
    } catch (error) {
        console.error('Error getting user articles:', error);
        return [];
    }
}

async function updateArticleInFirebase(articleId, articleData) {
    try {
        await db.collection('articles').doc(articleId).update({
            ...articleData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating article:', error);
        throw error;
    }
}

async function deleteArticleFromFirebase(articleId) {
    try {
        await db.collection('articles').doc(articleId).delete();
    } catch (error) {
        console.error('Error deleting article:', error);
        throw error;
    }
}

async function incrementArticleViews(articleId) {
    try {
        await db.collection('articles').doc(articleId).update({
            views: firebase.firestore.FieldValue.increment(1),
            lastViewed: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
}

// Cek authentication sebelum memuat
async function checkAuth() {
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
                    currentUser = userInfo;
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

// Load data dengan error handling
async function loadData() {
    try {
        articles = await getUserArticlesFromFirebase(currentUser.uid);
        console.log('Artikel dimuat:', articles.length);
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        articles = [];
        return false;
    }
}

// Validation functions dengan error handling
function validateArticleForm(formData) {
    const errors = [];
    
    if (!formData.title || !formData.title.trim()) {
        errors.push('Judul artikel wajib diisi');
    } else if (formData.title.length < 5) {
        errors.push('Judul minimal 5 karakter');
    }
    
    if (!formData.category) {
        errors.push('Kategori wajib dipilih');
    }
    
    if (!formData.content || !formData.content.trim()) {
        errors.push('Konten artikel wajib diisi');
    } else if (formData.content.length < 50) {
        errors.push('Konten minimal 50 karakter');
    }
    
    return errors;
}

function validateProfileForm(formData) {
    const errors = [];
    
    if (!formData.name || !formData.name.trim()) {
        errors.push('Nama lengkap wajib diisi');
    }
    
    if (!formData.email || !formData.email.trim()) {
        errors.push('Email wajib diisi');
    } else if (!DesaMediaUtils.validateEmail(formData.email)) {
        errors.push('Format email tidak valid');
    }
    
    return errors;
}

// Initialize dashboard dengan error handling
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard penulis dimuat');
    
    // Debug info
    console.log('=== DASHBOARD DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Firebase Auth:', typeof auth);
    console.log('Current User:', auth?.currentUser);
    console.log('LocalStorage User:', localStorage.getItem('currentUser'));
    
    // Cek authentication terlebih dahulu
    try {
        currentUser = await checkAuth();
        console.log('User terautentikasi:', currentUser.username);
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = 'login.html';
        return;
    }
    
    // Load data
    if (!await loadData()) {
        if (typeof DesaMediaUtils !== 'undefined') {
            DesaMediaUtils.showNotification('Error memuat data', 'error');
        }
        return;
    }
    
    try {
        updateUserInfo();
        loadDashboard();
        setupNavigation();
        setupForms();
        setupModal();
        setupUploadArea();
        
        console.log('Dashboard berhasil diinisialisasi');
    } catch (error) {
        console.error('Error inisialisasi dashboard:', error);
        if (typeof DesaMediaUtils !== 'undefined') {
            DesaMediaUtils.showNotification('Terjadi error saat memuat dashboard', 'error');
        }
    }
});

function updateUserInfo() {
    try {
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) userNameElement.textContent = currentUser.username;
        if (userRoleElement) userRoleElement.textContent = currentUser.role === 'editor' ? 'Editor' : 'Penulis';
        if (userAvatarElement) userAvatarElement.textContent = currentUser.username.charAt(0).toUpperCase();
        
        // Load profile data if exists
        loadProfileData();
    } catch (error) {
        console.error('Error update user info:', error);
    }
}

async function loadProfileData() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const profile = userDoc.exists ? userDoc.data() : {};
        
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileBio = document.getElementById('profileBio');
        const profilePhoto = document.getElementById('profilePhoto');
        
        if (profileName) profileName.value = profile.name || currentUser.username;
        if (profileEmail) profileEmail.value = profile.email || currentUser.email || '';
        if (profileBio) profileBio.value = profile.bio || '';
        if (profilePhoto) profilePhoto.value = profile.photo || '';
    } catch (error) {
        console.error('Error load profile data:', error);
    }
}

async function loadDashboard() {
    try {
        const userArticles = articles;
        const publishedArticles = userArticles.filter(article => article.status === 'published');
        const draftArticles = userArticles.filter(article => article.status === 'draft');
        const totalViews = userArticles.reduce((sum, article) => sum + (article.views || 0), 0);

        // Update stats
        const totalArticlesElement = document.getElementById('totalArticles');
        const publishedArticlesElement = document.getElementById('publishedArticles');
        const draftArticlesElement = document.getElementById('draftArticles');
        const totalViewsElement = document.getElementById('totalViews');
        
        if (totalArticlesElement) totalArticlesElement.textContent = userArticles.length;
        if (publishedArticlesElement) publishedArticlesElement.textContent = publishedArticles.length;
        if (draftArticlesElement) draftArticlesElement.textContent = draftArticles.length;
        if (totalViewsElement) totalViewsElement.textContent = totalViews;

        // Load recent articles
        const recentArticles = userArticles.slice(0, 5);
        loadArticlesTable('recentArticlesTable', recentArticles, true);
        loadArticlesTable('allArticlesTable', userArticles, false);
        
        console.log('Dashboard loaded:', {
            total: userArticles.length,
            published: publishedArticles.length,
            draft: draftArticles.length,
            views: totalViews
        });
    } catch (error) {
        console.error('Error load dashboard:', error);
    }
}

function loadArticlesTable(tableId, articlesList, isRecent) {
    try {
        const tableBody = document.getElementById(tableId);
        if (!tableBody) {
            console.error(`Tabel dengan ID ${tableId} tidak ditemukan`);
            return;
        }

        tableBody.innerHTML = '';

        if (articlesList.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${isRecent ? 5 : 6}" style="text-align: center; padding: 2rem;">Belum ada artikel</td></tr>`;
            return;
        }

        // Articles sudah diurutkan dari getUserArticlesFromFirebase
        articlesList.forEach(article => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${DesaMediaUtils.escapeHtml(article.title)}</td>
                <td>${DesaMediaUtils.escapeHtml(article.category)}</td>
                <td><span class="status status-${article.status}">${getStatusText(article.status)}</span></td>
                <td>${DesaMediaUtils.formatDate(article.createdAt)}</td>
                ${!isRecent ? `<td>${article.views || 0}</td>` : ''}
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
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error load articles table:', error);
    }
}

function getStatusText(status) {
    const statusMap = {
        'draft': 'Draft',
        'published': 'Dipublikasi',
        'review': 'Review'
    };
    return statusMap[status] || status;
}

function setupNavigation() {
    try {
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
                    if (section.style) section.style.display = 'none';
                });
                
                const targetSection = document.getElementById(`${sectionName}-section`);
                if (targetSection) {
                    targetSection.style.display = 'block';
                } else {
                    console.error(`Section dengan ID ${sectionName}-section tidak ditemukan`);
                }
                
                // Update page title
                updatePageTitle(sectionName);
            });
        });
    } catch (error) {
        console.error('Error setup navigation:', error);
    }
}

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

function setupForms() {
    try {
        // Article form - FIXED: Pastikan event listener terpasang
        const articleForm = document.getElementById('articleForm');
        if (articleForm) {
            console.log('Form artikel ditemukan, menambahkan event listener...');
            articleForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Form artikel disubmit');
                saveArticle(false);
            });
        } else {
            console.error('Form artikel tidak ditemukan!');
        }

        // Modal article form
        const modalArticleForm = document.getElementById('modalArticleForm');
        if (modalArticleForm) {
            modalArticleForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Form modal artikel disubmit');
                saveArticle(true);
            });
        } else {
            console.log('Form modal artikel tidak ditemukan (mungkin tidak digunakan)');
        }

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveProfile();
            });
        }
        
        console.log('Semua form berhasil di-setup');
    } catch (error) {
        console.error('Error setup forms:', error);
    }
}

function setupModal() {
    try {
        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            const modal = document.getElementById('newArticleModal');
            if (e.target === modal) {
                closeModal();
            }
        });
    } catch (error) {
        console.error('Error setup modal:', error);
    }
}

function setupUploadArea() {
    try {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('articleImageFile');
        
        if (uploadArea && fileInput) {
            // Click to upload
            uploadArea.addEventListener('click', () => fileInput.click());
            
            // Drag and drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    const event = new Event('change');
                    fileInput.dispatchEvent(event);
                }
            });
        }

        // Character counter
        const contentTextarea = document.getElementById('articleContent');
        const charCounter = document.getElementById('charCounter');
        
        if (contentTextarea && charCounter) {
            contentTextarea.addEventListener('input', function() {
                const length = this.value.length;
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
            });
        }

        // Loading state untuk submit button
        const articleForm = document.getElementById('articleForm');
        const submitBtn = document.getElementById('submitBtn');
        
        if (articleForm && submitBtn) {
            articleForm.addEventListener('submit', function() {
                submitBtn.classList.add('btn-loading');
                submitBtn.disabled = true;
                
                // Reset loading state setelah 3 detik (fallback)
                setTimeout(() => {
                    submitBtn.classList.remove('btn-loading');
                    submitBtn.disabled = false;
                }, 3000);
            });
        }
    } catch (error) {
        console.error('Error setup upload area:', error);
    }
}

// Default image berdasarkan kategori
function getDefaultImageByCategory(category) {
    const defaultImages = {
        'Pemerintahan': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Pertanian': 'https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Kesehatan': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Pendidikan': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Ekonomi': 'https://images.unsplash.com/photo-1660513502582-4a4c7b0c8bab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Keamanan': 'https://images.unsplash.com/photo-1600463246951-8b9dfb8b6c72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Pembangunan': 'https://images.unsplash.com/photo-1541976590-713941681591?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Lingkungan': 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
        'Sosial': 'https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    };
    
    return defaultImages[category] || defaultImages['Pemerintahan'];
}

// Enhanced saveArticle function - FIXED dengan cleaning content dan edit functionality
async function saveArticle(isModal) {
    try {
        console.log('Memulai proses save artikel...', isModal ? '(modal)' : '(form utama)');
        
        // Cek apakah sedang edit artikel
        const editingArticleId = localStorage.getItem('editingArticleId');
        const isEditing = !!editingArticleId;
        
        // Dapatkan nilai form
        const title = isModal ? 
            document.getElementById('modalArticleTitle').value : 
            document.getElementById('articleTitle').value;
            
        const category = isModal ? 
            document.getElementById('modalArticleCategory').value : 
            document.getElementById('articleCategory').value;
            
        const status = isModal ? 
            document.getElementById('modalArticleStatus').value : 
            document.getElementById('articleStatus').value;
            
        let content = isModal ? 
            document.getElementById('modalArticleContent').value : 
            document.getElementById('articleContent').value;
            
        const tags = isModal ? 
            document.getElementById('modalArticleTags').value : 
            document.getElementById('articleTags').value;

        console.log('Data form:', { title, category, status, content: content.substring(0, 50) + '...', tags, isEditing });

        // PERBAIKAN: Bersihkan konten dari kode yang tidak diinginkan
        const unwantedPatterns = [
            'dashboard.js:', 'Article saved with ID:', 'Form modal artikel disubmit',
            'Memulai proses save artikel...', 'Data form:', 'Menggunakan gambar default:',
            'Konten diformat', 'Data artikel siap disimpan:', 'User authenticated:',
            'Error getting user data:', 'Error getting user articles:',
            'Index belum dibuat', 'Melakukan sorting manual...', 'Artikel dimuat:',
            'Dashboard direload', 'Form direset', 'Preview gambar direset', 'Modal ditutup',
            'console.log', 'console.error', 'console.warn'
        ];
        
        let hasUnwantedContent = unwantedPatterns.some(pattern => content.includes(pattern));
        
        if (hasUnwantedContent) {
            console.warn('Konten terdeteksi mengandung log console yang tidak diinginkan, menggunakan placeholder');
            content = `# Artikel tentang ${category.toLowerCase()} di desa

Silakan tulis konten artikel Anda di sini...

## Contoh Format

Anda bisa menggunakan format berikut:

- **Teks tebal** untuk penekanan penting
- _Teks miring_ untuk kutipan atau istilah asing
- [Tautan ke website](https://contoh.com) untuk referensi
- > Kutipan untuk menyorot informasi penting

## Mulai Menulis

Mulai menulis konten artikel Anda di bagian ini. Pastikan informasi yang disampaikan akurat dan bermanfaat bagi pembaca.`;
        }

        // Validasi form
        const formData = { title, category, content };
        const errors = validateArticleForm(formData);
        
        if (errors.length > 0) {
            alert('Error:\n' + errors.join('\n'));
            return;
        }

        // Dapatkan gambar yang diupload
        let image = null;
        if (typeof ImageUploader !== 'undefined') {
            const imageData = ImageUploader.getUploadedImage(isModal ? 'modal' : 'article');
            if (imageData) {
                image = imageData;
                console.log('Gambar diupload:', image);
            }
        }

        // Jika tidak ada gambar yang diupload, gunakan default berdasarkan kategori
        if (!image) {
            image = getDefaultImageByCategory(category);
            console.log('Menggunakan gambar default:', image);
        }

        // Format content jika ArticleEditor tersedia
        let formattedContent = content;
        if (typeof ArticleEditor !== 'undefined') {
            formattedContent = ArticleEditor.formatContent(content);
            console.log('Konten diformat');
        }

        const articleData = {
            title: title.trim(),
            category,
            status,
            image: image,
            content: formattedContent,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            readTime: DesaMediaUtils.calculateReadTime(content),
            excerpt: content.substring(0, 150) + '...',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Jika edit, tambahkan author dan authorId dari artikel yang lama
        if (isEditing) {
            const originalArticle = articles.find(a => a.id === editingArticleId);
            if (originalArticle) {
                articleData.author = originalArticle.author;
                articleData.authorId = originalArticle.authorId;
                // Jaga createdAt asli
                articleData.createdAt = originalArticle.createdAt;
            }
        }

        console.log('Data artikel siap disimpan:', articleData);

        // Tampilkan loading state
        const submitBtn = isModal ? 
            document.querySelector('#modalArticleForm button[type="submit"]') : 
            document.getElementById('submitBtn');
            
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + 
                (isEditing ? 'Mengupdate...' : 'Menyimpan...');
            submitBtn.disabled = true;
        }

        let articleId;
        if (isEditing) {
            // Update artikel yang sudah ada
            await updateArticleInFirebase(editingArticleId, articleData);
            articleId = editingArticleId;
            console.log('Artikel berhasil diupdate dengan ID:', articleId);
            // Hapus editing state
            localStorage.removeItem('editingArticleId');
        } else {
            // Buat artikel baru
            articleId = await saveArticleToFirebase(articleData);
            console.log('Artikel berhasil disimpan dengan ID:', articleId);
        }
        
        // Show notification
        if (status === 'published') {
            DesaMediaUtils.showNotification(
                isEditing ? 'Artikel berhasil diupdate dan dipublikasi!' : 'Artikel berhasil dipublikasi!', 
                'success'
            );
        } else {
            DesaMediaUtils.showNotification(
                isEditing ? 'Artikel berhasil diupdate sebagai draft.' : 'Artikel berhasil disimpan sebagai draft.', 
                'success'
            );
        }
        
        // Reset form
        const form = isModal ? document.getElementById('modalArticleForm') : document.getElementById('articleForm');
        if (form) {
            form.reset();
            console.log('Form direset');
        }
        
        // Reset image preview dan upload
        if (typeof ImageUploader !== 'undefined') {
            ImageUploader.clearImagePreview(isModal ? 'modal' : 'article');
            console.log('Preview gambar direset');
        }
        
        if (isModal) {
            closeModal();
            console.log('Modal ditutup');
        }
        
        // Reset page title jika sedang edit
        if (isEditing) {
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = 'Tulis Artikel Baru';
        }
        
        // Reload data
        await loadData();
        loadDashboard();
        console.log('Dashboard direload');
        
        // Reset button state
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Artikel';
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('Error save article:', error);
        DesaMediaUtils.showNotification('Terjadi error saat menyimpan artikel: ' + error.message, 'error');
        
        // Reset button state jika error
        const submitBtn = isModal ? 
            document.querySelector('#modalArticleForm button[type="submit"]') : 
            document.getElementById('submitBtn');
            
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Artikel';
            submitBtn.disabled = false;
        }
    }
}

function showNewArticleModal() {
    try {
        const modal = document.getElementById('newArticleModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error show new article modal:', error);
    }
}

function closeModal() {
    try {
        const modal = document.getElementById('newArticleModal');
        const modalForm = document.getElementById('modalArticleForm');
        
        if (modal) modal.style.display = 'none';
        if (modalForm) modalForm.reset();
        
        // Hapus editing state jika modal ditutup
        localStorage.removeItem('editingArticleId');
    } catch (error) {
        console.error('Error close modal:', error);
    }
}

// Enhanced resetForm function
function resetForm() {
    try {
        const articleForm = document.getElementById('articleForm');
        if (articleForm) articleForm.reset();
        
        if (typeof ImageUploader !== 'undefined') {
            ImageUploader.clearImagePreview('article');
        }
        
        // Hapus editing state
        localStorage.removeItem('editingArticleId');
        
        // Reset page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Tulis Artikel Baru';
        
        DesaMediaUtils.showNotification('Form berhasil direset', 'info');
    } catch (error) {
        console.error('Error reset form:', error);
    }
}

async function viewArticle(articleId) {
    try {
        // Simpan artikel yang dilihat di localStorage untuk diakses di halaman utama
        localStorage.setItem('currentArticle', articleId);
        
        // Increment view count
        await incrementArticleViews(articleId);
        
        window.open('article.html', '_blank');
    } catch (error) {
        console.error('Error view article:', error);
    }
}

async function editArticle(articleId) {
    try {
        const article = articles.find(a => a.id === articleId);
        if (article) {
            // Isi form dengan data artikel
            const articleTitle = document.getElementById('articleTitle');
            const articleCategory = document.getElementById('articleCategory');
            const articleStatus = document.getElementById('articleStatus');
            const articleContent = document.getElementById('articleContent');
            const articleTags = document.getElementById('articleTags');
            
            if (articleTitle) articleTitle.value = article.title;
            if (articleCategory) articleCategory.value = article.category;
            if (articleStatus) articleStatus.value = article.status;
            
            // Untuk konten, kita coba hilangkan tag HTML untuk editing
            let contentForEditing = article.content;
            // Hapus tag HTML sederhana jika ada
            contentForEditing = contentForEditing.replace(/<[^>]*>/g, '');
            // Decode entitas HTML
            const textarea = document.createElement('textarea');
            textarea.innerHTML = contentForEditing;
            contentForEditing = textarea.value;
            
            if (articleContent) articleContent.value = contentForEditing;
            if (articleTags) articleTags.value = article.tags ? article.tags.join(', ') : '';
            
            // Simpan articleId yang sedang diedit di localStorage
            localStorage.setItem('editingArticleId', articleId);
            
            // Pindah ke section new article
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const newArticleNav = document.querySelector('[data-section="new-article"]');
            if (newArticleNav) newArticleNav.classList.add('active');
            
            document.querySelectorAll('[id$="-section"]').forEach(section => {
                if (section.style) section.style.display = 'none';
            });
            
            const newArticleSection = document.getElementById('new-article-section');
            if (newArticleSection) newArticleSection.style.display = 'block';
            
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = 'Edit Artikel';
            
            DesaMediaUtils.showNotification('Artikel siap untuk diedit', 'info');
        }
    } catch (error) {
        console.error('Error edit article:', error);
    }
}

async function deleteArticle(articleId) {
    try {
        if (confirm('Apakah Anda yakin ingin menghapus artikel ini?')) {
            await deleteArticleFromFirebase(articleId);
            // Reload data
            await loadData();
            loadDashboard();
            DesaMediaUtils.showNotification('Artikel berhasil dihapus!', 'success');
        }
    } catch (error) {
        console.error('Error delete article:', error);
    }
}

async function saveProfile() {
    try {
        const name = document.getElementById('profileName');
        const email = document.getElementById('profileEmail');
        const bio = document.getElementById('profileBio');
        const photo = document.getElementById('profilePhoto');

        if (!name || !email) {
            DesaMediaUtils.showNotification('Form profil tidak lengkap', 'error');
            return;
        }

        const formData = { 
            name: name.value, 
            email: email.value 
        };
        const errors = validateProfileForm(formData);
        
        if (errors.length > 0) {
            alert('Error:\n' + errors.join('\n'));
            return;
        }

        const profile = {
            name: name.value,
            email: email.value,
            bio: bio ? bio.value : '',
            photo: photo ? photo.value : '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to Firestore
        await db.collection('users').doc(currentUser.uid).set(profile, { merge: true });
        
        DesaMediaUtils.showNotification('Profil berhasil diperbarui!', 'success');
        
        // Update user info display
        updateUserInfo();
    } catch (error) {
        console.error('Error save profile:', error);
        DesaMediaUtils.showNotification('Error menyimpan profil', 'error');
    }
}

// Fungsi logout
async function logout() {
    try {
        await auth.signOut();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Fungsi bantuan untuk tag
function addTag(tag) {
    try {
        const tagsInput = document.getElementById('articleTags');
        if (!tagsInput) return;
        
        const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
        
        if (!currentTags.includes(tag)) {
            if (currentTags.length > 0) {
                tagsInput.value = currentTags.join(', ') + ', ' + tag;
            } else {
                tagsInput.value = tag;
            }
        }
        
        tagsInput.focus();
    } catch (error) {
        console.error('Error add tag:', error);
    }
}

// Make functions globally available
window.addTag = addTag;
window.showNewArticleModal = showNewArticleModal;
window.closeModal = closeModal;
window.resetForm = resetForm;
window.viewArticle = viewArticle;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.logout = logout;