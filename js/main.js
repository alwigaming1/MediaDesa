// main.js - Enhanced main functionality dengan Firebase
console.log('Memuat main.js...');

// Data dan state management
let articles = [];
let categories = ['Pemerintahan', 'Pertanian', 'Kesehatan', 'Pendidikan', 'Ekonomi', 'Keamanan', 'Pembangunan', 'Lingkungan', 'Sosial'];

// Load articles from Firebase
async function loadArticlesFromFirebase() {
    try {
        console.log('Memuat artikel dari Firebase...');
        let snapshot;
        
        try {
            // Coba dengan orderBy terlebih dahulu
            snapshot = await db.collection('articles')
                .where('status', '==', 'published')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
        } catch (error) {
            // Jika error karena index, ambil tanpa orderBy
            if (error.code === 'failed-precondition') {
                console.warn('Index belum dibuat, mengambil data tanpa orderBy...');
                snapshot = await db.collection('articles')
                    .where('status', '==', 'published')
                    .limit(50)
                    .get();
            } else {
                throw error;
            }
        }
            
        articles = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firebase timestamp to Date
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
        }));
        
        // Jika tidak menggunakan orderBy, lakukan sorting manual
        if (!snapshot.query._query.orderBy.length) {
            console.log('Melakukan sorting manual artikel...');
            articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        console.log('Artikel yang dipublikasi:', articles.length);
        return articles;
    } catch (error) {
        console.error('Error loading articles from Firebase:', error);
        return [];
    }
}

// Enhanced initialization
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Website DesaMedia dimuat');
    
    try {
        // Load articles first
        await loadArticlesFromFirebase();
        
        // Then load the UI
        loadBreakingNews();
        loadCategories();
        setupEventListeners();
        addAuthorButton();
        setupAutoRefresh();
        initializeSearch();
        
        // Load articles to UI
        loadArticlesFromStorage();
        
        console.log('Main.js initialized successfully');
    } catch (error) {
        console.error('Error initializing main.js:', error);
        // Fallback: tampilkan pesan error
        const featuredContainer = document.getElementById('featuredNews');
        if (featuredContainer) {
            featuredContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <h3>Gagal memuat artikel</h3>
                    <p>Silakan refresh halaman atau coba lagi nanti</p>
                    <button onclick="window.location.reload()" class="btn" style="margin-top: 1rem;">Refresh Halaman</button>
                </div>
            `;
        }
    }
});

// Load breaking news
function loadBreakingNews() {
    try {
        const breakingText = document.getElementById('breakingText');
        const publishedArticles = articles.filter(article => article.status === 'published');
        
        if (publishedArticles.length > 0) {
            const latestArticle = publishedArticles[0];
            breakingText.textContent = `TERBARU: ${latestArticle.title} - Baca selengkapnya di halaman utama`;
        } else {
            breakingText.textContent = 'Selamat datang di DesaMedia - Portal berita desa terpercaya';
        }
    } catch (error) {
        console.error('Error loading breaking news:', error);
    }
}

// Load articles from Firebase
async function loadArticlesFromStorage() {
    try {
        console.log('Memuat artikel untuk ditampilkan...');
        const publishedArticles = articles.filter(article => article.status === 'published');
        console.log('Artikel yang dipublikasi:', publishedArticles.length);
        
        // Update semua section
        updateHeroSection(publishedArticles);
        updateFeaturedNews(publishedArticles);
        updateLatestNews(publishedArticles);
        updatePopularNews(publishedArticles);
        updateVideoSection(publishedArticles);
        updateFooterCategories();
    } catch (error) {
        console.error('Error loading articles from storage:', error);
    }
}

function updateHeroSection(articles) {
    try {
        const heroSection = document.getElementById('heroArticle');
        const heroSidebar = document.getElementById('heroSidebar');
        
        if (!heroSection || articles.length === 0) {
            if (heroSection) {
                heroSection.innerHTML = `
                    <div class="hero-image" style="background-image: url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')"></div>
                    <div class="hero-content">
                        <span class="hero-category">BERITA</span>
                        <h2 class="hero-title">Selamat Datang di DesaMedia</h2>
                        <div class="hero-meta">
                            <span><i class="far fa-calendar"></i> ${DesaMediaUtils.formatDate(new Date().toISOString())}</span>
                            <span><i class="far fa-user"></i> Admin</span>
                            <span><i class="far fa-eye"></i> 0 Dilihat</span>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        const latestArticle = articles[0];
        
        heroSection.innerHTML = `
            <div class="hero-image" style="background-image: url('${latestArticle.image}')"></div>
            <div class="hero-content">
                <span class="hero-category">${latestArticle.category}</span>
                <h2 class="hero-title">${latestArticle.title}</h2>
                <div class="hero-meta">
                    <span><i class="far fa-calendar"></i> ${DesaMediaUtils.formatDate(latestArticle.createdAt)}</span>
                    <span><i class="far fa-user"></i> ${latestArticle.author}</span>
                    <span><i class="far fa-eye"></i> ${latestArticle.views || 0} Dilihat</span>
                </div>
            </div>
        `;
        
        // Tambahkan event click ke hero section
        heroSection.onclick = () => viewArticle(latestArticle.id);
        
        // Update sidebar
        updateHeroSidebar(articles.slice(1, 4), heroSidebar);
    } catch (error) {
        console.error('Error updating hero section:', error);
    }
}

function updateHeroSidebar(sidebarArticles, container) {
    try {
        if (!container || sidebarArticles.length === 0) {
            container.innerHTML = `
                <div class="side-news">
                    <div class="side-image" style="background-image: url('https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80')"></div>
                    <div class="side-content">
                        <h3 class="side-title">Belum ada berita lainnya</h3>
                        <div class="side-meta">Cek kembali nanti</div>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = sidebarArticles.map(article => `
            <div class="side-news" onclick="viewArticle('${article.id}')">
                <div class="side-image" style="background-image: url('${article.image}')"></div>
                <div class="side-content">
                    <h3 class="side-title">${DesaMediaUtils.escapeHtml(article.title)}</h3>
                    <div class="side-meta">${DesaMediaUtils.formatDate(article.createdAt)} • ${article.views || 0} dilihat</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating hero sidebar:', error);
    }
}

function updateFeaturedNews(articles) {
    try {
        const featuredContainer = document.getElementById('featuredNews');
        if (!featuredContainer) return;
        
        // Ambil 3 artikel terbaru setelah hero
        const featuredArticles = articles.slice(0, 3);
        
        if (featuredArticles.length === 0) {
            featuredContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <h3>Belum ada artikel</h3>
                    <p>Artikel yang dipublikasi akan muncul di sini</p>
                    <a href="login.html" class="btn" style="margin-top: 1rem;">Login untuk Menulis</a>
                </div>
            `;
            return;
        }
        
        featuredContainer.innerHTML = featuredArticles.map(article => `
            <article class="news-card" onclick="viewArticle('${article.id}')">
                <div class="news-image" style="background-image: url('${article.image}')"></div>
                <div class="news-content">
                    <span class="news-category">${article.category}</span>
                    <h3 class="news-title">${DesaMediaUtils.escapeHtml(article.title)}</h3>
                    <p class="news-excerpt">${DesaMediaUtils.escapeHtml(article.content.substring(0, 100))}...</p>
                    <div class="news-meta">
                        <span>${DesaMediaUtils.formatDate(article.createdAt)}</span>
                        <span>Oleh: ${article.author}</span>
                    </div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error updating featured news:', error);
    }
}

function updateLatestNews(articles) {
    try {
        const latestContainer = document.getElementById('latestNews');
        if (!latestContainer) return;
        
        // Ambil 4 artikel berikutnya
        const latestArticles = articles.slice(0, 4);
        
        if (latestArticles.length === 0) {
            latestContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <p>Belum ada artikel terbaru</p>
                </div>
            `;
            return;
        }
        
        latestContainer.innerHTML = latestArticles.map(article => `
            <article class="news-item" onclick="viewArticle('${article.id}')">
                <div class="news-item-image" style="background-image: url('${article.image}')"></div>
                <div class="news-item-content">
                    <h3 class="news-item-title">${DesaMediaUtils.escapeHtml(article.title)}</h3>
                    <p class="news-item-excerpt">${DesaMediaUtils.escapeHtml(article.content.substring(0, 80))}...</p>
                    <div class="news-item-meta">
                        <span>${DesaMediaUtils.formatDate(article.createdAt)}</span> • <span>${article.category}</span>
                    </div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error updating latest news:', error);
    }
}

function updatePopularNews(articles) {
    try {
        const popularContainer = document.getElementById('popularNews');
        if (!popularContainer) return;
        
        // Sort by views (or by date if no views)
        const popularArticles = [...articles]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 5);
        
        if (popularArticles.length === 0) {
            popularContainer.innerHTML = `
                <div style="text-align: center; padding: 1rem;">
                    <p>Belum ada artikel populer</p>
                </div>
            `;
            return;
        }
        
        popularContainer.innerHTML = popularArticles.map((article, index) => `
            <div class="popular-item" onclick="viewArticle('${article.id}')">
                <div class="popular-rank">${index + 1}</div>
                <div class="popular-content">
                    <h4 class="popular-title">${DesaMediaUtils.escapeHtml(article.title)}</h4>
                    <div class="popular-meta">${article.views || 0} dilihat • ${formatRelativeTime(article.createdAt)}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating popular news:', error);
    }
}

function updateVideoSection(articles) {
    try {
        const videoContainer = document.getElementById('videoGrid');
        if (!videoContainer) return;
        
        // Untuk demo, kita buat video placeholder
        const videoArticles = articles.slice(0, 3);
        
        if (videoArticles.length === 0) {
            videoContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <p>Belum ada video tersedia</p>
                </div>
            `;
            return;
        }
        
        videoContainer.innerHTML = videoArticles.map(article => `
            <div class="video-card" onclick="viewArticle('${article.id}')">
                <div class="video-thumbnail" style="background-image: url('${article.image}')">
                    <div class="video-play"><i class="fas fa-play"></i></div>
                </div>
                <div class="video-content">
                    <h3 class="video-title">${DesaMediaUtils.escapeHtml(article.title)}</h3>
                    <div class="video-meta">
                        <span>${DesaMediaUtils.formatDate(article.createdAt)}</span>
                        <span>${DesaMediaUtils.calculateReadTime(article.content)} min</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error updating video section:', error);
    }
}

async function loadCategories() {
    try {
        const categoriesGrid = document.getElementById('categoriesGrid');
        const footerCategories = document.getElementById('footerCategories');
        
        // Try to load categories from Firestore
        let categoriesData = [];
        try {
            const snapshot = await db.collection('categories').where('isActive', '==', true).orderBy('order').get();
            categoriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.log('Using default categories');
            categoriesData = categories.map(name => ({ id: name, name }));
        }
        
        if (categoriesGrid) {
            categoriesGrid.innerHTML = categoriesData.map(category => {
                const count = articles.filter(article => 
                    article.category === category.name && article.status === 'published'
                ).length;
                
                return `
                    <div class="category-card" onclick="filterByCategory('${category.name}')">
                        <div class="category-icon">${DesaMediaUtils.getCategoryIcon(category.name)}</div>
                        <h3 class="category-title">${category.name}</h3>
                        <p class="category-count">${count} Artikel</p>
                    </div>
                `;
            }).join('');
        }
        
        if (footerCategories) {
            footerCategories.innerHTML = categoriesData.map(category => `
                <li><a href="#" onclick="filterByCategory('${category.name}')">${category.name}</a></li>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function updateFooterCategories() {
    try {
        const footerCategories = document.getElementById('footerCategories');
        if (footerCategories) {
            footerCategories.innerHTML = categories.map(category => {
                const count = articles.filter(article => 
                    article.category === category && article.status === 'published'
                ).length;
                return `<li><a href="#" onclick="filterByCategory('${category}')">${category} (${count})</a></li>`;
            }).join('');
        }
    } catch (error) {
        console.error('Error updating footer categories:', error);
    }
}

// Enhanced navigation function
async function navigateToArticle(articleId) {
    if (!articleId) {
        DesaMediaUtils.showNotification('Artikel tidak ditemukan!', 'error');
        return;
    }
    
    // Update view count di Firebase
    try {
        await db.collection('articles').doc(articleId).update({
            views: firebase.firestore.FieldValue.increment(1),
            lastViewed: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating view count:', error);
    }
    
    // Save and navigate
    localStorage.setItem('currentArticle', articleId);
    window.open('article.html', '_blank');
}

// Enhanced viewArticle function
function viewArticle(articleId) {
    console.log('Membuka artikel:', articleId);
    
    if (!articleId) {
        DesaMediaUtils.showNotification('ID artikel tidak valid', 'error');
        return;
    }
    
    const article = articles.find(a => a.id === articleId);
    if (!article) {
        DesaMediaUtils.showNotification('Artikel tidak ditemukan', 'error');
        return;
    }
    
    if (article.status !== 'published') {
        DesaMediaUtils.showNotification('Artikel belum dipublikasikan', 'warning');
        return;
    }
    
    navigateToArticle(articleId);
}

// Search functionality
function initializeSearch() {
    try {
        const searchBtn = document.querySelector('.search-btn');
        if (!searchBtn) return;

        const searchBox = document.createElement('div');
        searchBox.className = 'search-box';
        searchBox.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: none;
            z-index: 1001;
            min-width: 300px;
        `;
        
        searchBox.innerHTML = `
            <div class="search-header" style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="margin: 0;">Cari Artikel</h4>
                <button class="close-search" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>
            <input type="text" id="searchInput" placeholder="Ketik kata kunci..." 
                   style="width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 0.5rem;">
            <div id="searchResults" style="max-height: 300px; overflow-y: auto;"></div>
        `;
        
        document.querySelector('.header-actions').appendChild(searchBox);
        
        // Event listeners for search
        searchBtn.addEventListener('click', function() {
            searchBox.style.display = searchBox.style.display === 'block' ? 'none' : 'block';
            if (searchBox.style.display === 'block') {
                document.getElementById('searchInput').focus();
            }
        });
        
        searchBox.querySelector('.close-search').addEventListener('click', function() {
            searchBox.style.display = 'none';
        });
        
        // Debounced search
        const searchInput = document.getElementById('searchInput');
        const performSearch = DesaMediaUtils.debounce(function() {
            const term = searchInput.value.trim();
            if (term.length < 2) {
                document.getElementById('searchResults').innerHTML = '<p style="padding: 0.5rem; color: #718096;">Ketik minimal 2 karakter</p>';
                return;
            }
            
            const results = searchArticles(term);
            displaySearchResults(results, term);
        }, 300);
        
        searchInput.addEventListener('input', performSearch);
    } catch (error) {
        console.error('Error initializing search:', error);
    }
}

// Enhanced search function
function searchArticles(searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    return articles.filter(article => 
        article.status === 'published' && (
            article.title.toLowerCase().includes(searchLower) ||
            article.content.toLowerCase().includes(searchLower) ||
            (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
            article.category.toLowerCase().includes(searchLower) ||
            article.author.toLowerCase().includes(searchLower)
        )
    );
}

// Display search results
function displaySearchResults(results, searchTerm) {
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div style="padding: 1rem; text-align: center; color: #718096;">
                <p>Tidak ditemukan artikel untuk "${searchTerm}"</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = results.map(article => `
        <div class="search-result-item" 
             onclick="viewArticle('${article.id}'); document.querySelector('.search-box').style.display='none'"
             style="padding: 0.75rem; border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: background-color 0.2s;">
            <div style="display: flex; gap: 0.75rem; align-items: start;">
                <div style="width: 60px; height: 40px; background-image: url('${article.image}'); 
                          background-size: cover; background-position: center; border-radius: 4px; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                    <h6 style="margin: 0 0 0.25rem 0; font-size: 0.9rem; color: #2d3748;">${DesaMediaUtils.escapeHtml(article.title)}</h6>
                    <div style="font-size: 0.75rem; color: #718096;">
                        <span>${article.category}</span> • 
                        <span>${DesaMediaUtils.formatDate(article.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add view all results link
    resultsContainer.innerHTML += `
        <div style="padding: 0.75rem; text-align: center; border-top: 1px solid #e2e8f0;">
            <a href="#" onclick="showAllSearchResults('${searchTerm}')" 
               style="color: #1a365d; font-size: 0.9rem; text-decoration: none;">
                Lihat semua ${results.length} hasil
            </a>
        </div>
    `;
}

// Show all search results
function showAllSearchResults(searchTerm) {
    localStorage.setItem('searchTerm', searchTerm);
    window.open('search.html', '_blank');
}

// Enhanced filter by category
function filterByCategory(category) {
    const filteredArticles = articles.filter(article => 
        article.category === category && article.status === 'published'
    );
    
    if (filteredArticles.length > 0) {
        localStorage.setItem('currentFilter', category);
        DesaMediaUtils.showNotification(`Menampilkan ${filteredArticles.length} artikel dalam kategori: ${category}`);
        
        // Update UI to show filtered results
        updateFeaturedNews(filteredArticles);
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) {
            sectionTitle.textContent = `Kategori: ${category}`;
        }
        const viewAllBtn = document.getElementById('viewAllBtn');
        if (viewAllBtn) {
            viewAllBtn.style.display = 'block';
        }
    } else {
        DesaMediaUtils.showNotification(`Belum ada artikel dalam kategori: ${category}`, 'info');
    }
}

// Enhanced setupEventListeners
function setupEventListeners() {
    try {
        // Mobile menu toggle
        const mobileMenu = document.querySelector('.mobile-menu');
        const nav = document.querySelector('nav ul');
        
        if (mobileMenu && nav) {
            mobileMenu.addEventListener('click', function() {
                if (nav.style.display === 'flex') {
                    nav.style.display = 'none';
                } else {
                    nav.style.display = 'flex';
                    nav.style.flexDirection = 'column';
                    nav.style.position = 'absolute';
                    nav.style.top = '100%';
                    nav.style.left = '0';
                    nav.style.width = '100%';
                    nav.style.backgroundColor = 'var(--white)';
                    nav.style.padding = '1rem 0';
                    nav.style.boxShadow = '0 5px 10px rgba(0,0,0,0.1)';
                }
            });
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('nav') && !e.target.closest('.mobile-menu')) {
                if (nav) nav.style.display = 'none';
            }
        });
        
        // Category navigation
        document.querySelectorAll('nav a[data-category]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const category = this.getAttribute('data-category');
                filterByCategory(category);
            });
        });
        
        // Reset filter
        const viewAllBtn = document.getElementById('viewAllBtn');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('currentFilter');
                loadArticlesFromStorage();
                const sectionTitle = document.querySelector('.section-title');
                if (sectionTitle) {
                    sectionTitle.textContent = 'Berita Terbaru';
                }
                this.style.display = 'none';
                DesaMediaUtils.showNotification('Menampilkan semua artikel');
            });
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

function addAuthorButton() {
    try {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.querySelector('.author-area-btn')) {
            const loginBtn = document.createElement('a');
            loginBtn.href = 'login.html';
            loginBtn.className = 'btn btn-outline author-area-btn';
            loginBtn.innerHTML = '<i class="fas fa-pen"></i> Area Penulis';
            loginBtn.style.marginRight = '1rem';
            headerActions.insertBefore(loginBtn, headerActions.firstChild);
        }
    } catch (error) {
        console.error('Error adding author button:', error);
    }
}

function setupAutoRefresh() {
    // Refresh articles ketika tab diaktifkan
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            loadArticlesFromStorage();
        }
    });
    
    // Refresh setiap 30 detik
    setInterval(async () => {
        await loadArticlesFromFirebase();
        loadArticlesFromStorage();
    }, 30000);
}

// Helper function for relative time
function formatRelativeTime(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 hari lalu';
        if (diffDays < 7) return `${diffDays} hari lalu`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
        return `${Math.floor(diffDays / 30)} bulan lalu`;
    } catch (e) {
        return 'Beberapa waktu lalu';
    }
}

// Make functions globally available
window.viewArticle = viewArticle;
window.filterByCategory = filterByCategory;
window.showAllSearchResults = showAllSearchResults;