// article.js - Enhanced article functionality
class ArticleManager {
    static init() {
        console.log('Initializing ArticleManager...');
        this.loadArticle();
        this.setupEventListeners();
    }

    static async loadArticle() {
        const articleId = localStorage.getItem('currentArticle');
        
        if (articleId) {
            try {
                // Load article data first
                const doc = await db.collection('articles').doc(articleId).get();
                
                if (doc.exists) {
                    const article = {
                        id: doc.id,
                        ...doc.data(),
                        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
                    };
                    
                    // Then increment views
                    await this.incrementArticleViews(articleId);
                    
                    // Display the article
                    this.displayArticle(article);
                    this.loadRelatedArticles(article);
                    this.loadSidebarContent();
                    this.setupShareButtons(article);
                    
                } else {
                    this.showArticleNotFound();
                }
            } catch (error) {
                console.error('Error loading article:', error);
                this.showArticleNotFound();
            }
        } else {
            this.showArticleNotFound();
        }
    }

    static async incrementArticleViews(articleId) {
        try {
            await db.collection('articles').doc(articleId).update({
                views: firebase.firestore.FieldValue.increment(1),
                lastViewed: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    }

    static displayArticle(article) {
        console.log('Displaying article:', article.title);
        
        // Update document title
        document.title = `${article.title} - DesaMedia`;
        
        // Update article content dengan format baru
        document.getElementById('articleCategory').textContent = `DesaMedia / ${article.category}`;
        document.getElementById('articleTitle').textContent = article.title;
        
        // Update meta information
        document.getElementById('metaAuthor').textContent = article.author;
        document.getElementById('metaDate').textContent = this.formatDate(article.createdAt);
        document.getElementById('metaViews').textContent = article.views || 0;
        document.getElementById('metaReadTime').textContent = article.readTime || this.calculateReadTime(article.content);
        
        // Update article image
        const articleImage = document.getElementById('articleImage');
        if (article.image) {
            articleImage.style.backgroundImage = `url('${article.image}')`;
        } else {
            articleImage.style.backgroundImage = `url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`;
        }
        
        // Update article content with enhanced formatting
        document.getElementById('articleBody').innerHTML = this.formatContent(article.content);
        
        // Update tags
        this.updateTags(article.tags);
        
        // Update author information
        this.updateAuthor(article.author);
    }

    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const options = { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            };
            return date.toLocaleDateString('id-ID', options);
        } catch (e) {
            return 'Tanggal tidak tersedia';
        }
    }

    static formatContent(content) {
        if (!content) return '<p>Konten tidak tersedia.</p>';
        
        if (content.includes('<')) {
            return content;
        }
        
        const paragraphs = content.split('\n\n');
        let formattedContent = '';
        
        paragraphs.forEach(paragraph => {
            if (paragraph.trim()) {
                if (paragraph.length < 100 && !paragraph.includes('.') && paragraph.trim().length > 10) {
                    formattedContent += `<h2>${paragraph.trim()}</h2>`;
                } else {
                    formattedContent += `<p>${paragraph.trim()}</p>`;
                }
            }
        });
        
        return formattedContent;
    }

    static updateTags(tags) {
        const tagsContainer = document.getElementById('articleTags');
        if (tags && tags.length > 0) {
            tagsContainer.innerHTML = tags.map(tag => 
                `<a href="#" class="tag" onclick="ArticleManager.searchByTag('${tag}')">#${tag}</a>`
            ).join('');
        } else {
            tagsContainer.innerHTML = '<a href="#" class="tag">#BeritaDesa</a>';
        }
    }

    static async updateAuthor(authorName) {
        try {
            const snapshot = await db.collection('users').where('username', '==', authorName).get();
            let authorProfile = {};
            
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    authorProfile = doc.data();
                });
            }
            
            const authorAvatar = document.getElementById('authorAvatar');
            const authorNameElement = document.getElementById('authorName');
            const authorBioElement = document.getElementById('authorBio');
            
            if (authorProfile.photo) {
                authorAvatar.style.backgroundImage = `url('${authorProfile.photo}')`;
            } else {
                authorAvatar.style.backgroundColor = '#1a365d';
                authorAvatar.style.display = 'flex';
                authorAvatar.style.alignItems = 'center';
                authorAvatar.style.justifyContent = 'center';
                authorAvatar.style.color = 'white';
                authorAvatar.style.fontSize = '1.5rem';
                authorAvatar.style.fontWeight = 'bold';
                authorAvatar.textContent = authorName.charAt(0).toUpperCase();
            }
            
            authorNameElement.textContent = authorProfile.name || authorName;
            authorBioElement.textContent = authorProfile.bio || 'Penulis aktif di DesaMedia yang berdedikasi menyampaikan informasi terpercaya untuk masyarakat desa.';
        } catch (error) {
            console.error('Error loading author profile:', error);
            const authorAvatar = document.getElementById('authorAvatar');
            const authorNameElement = document.getElementById('authorName');
            const authorBioElement = document.getElementById('authorBio');
            
            authorAvatar.style.backgroundColor = '#1a365d';
            authorAvatar.style.display = 'flex';
            authorAvatar.style.alignItems = 'center';
            authorAvatar.style.justifyContent = 'center';
            authorAvatar.style.color = 'white';
            authorAvatar.style.fontSize = '1.5rem';
            authorAvatar.style.fontWeight = 'bold';
            authorAvatar.textContent = authorName.charAt(0).toUpperCase();
            
            authorNameElement.textContent = authorName;
            authorBioElement.textContent = 'Penulis aktif di DesaMedia yang berdedikasi menyampaikan informasi terpercaya untuk masyarakat desa.';
        }
    }

    static calculateReadTime(content) {
        const wordsPerMinute = 200;
        const words = content.split(/\s+/).length;
        return Math.max(1, Math.ceil(words / wordsPerMinute));
    }

    static async loadRelatedArticles(currentArticle) {
        try {
            const snapshot = await db.collection('articles')
                .where('status', '==', 'published')
                .where('category', '==', currentArticle.category)
                .where(firebase.firestore.FieldPath.documentId(), '!=', currentArticle.id)
                .limit(3)
                .get();
                
            const relatedArticles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            }));
            
            if (relatedArticles.length === 0) {
                const recentSnapshot = await db.collection('articles')
                    .where('status', '==', 'published')
                    .where(firebase.firestore.FieldPath.documentId(), '!=', currentArticle.id)
                    .orderBy('createdAt', 'desc')
                    .limit(3)
                    .get();
                    
                const recentArticles = recentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
                }));
                
                this.displayRelatedArticles(recentArticles, document.getElementById('relatedNews'));
            } else {
                this.displayRelatedArticles(relatedArticles, document.getElementById('relatedNews'));
            }
        } catch (error) {
            console.error('Error loading related articles:', error);
            document.getElementById('relatedNews').innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <p style="color: #718096;">Belum ada berita terkait</p>
                </div>
            `;
        }
    }

    static displayRelatedArticles(articles, container) {
        if (!container) return;
        
        if (articles.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <p style="color: #718096;">Belum ada berita terkait</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = articles.map(article => `
            <article class="news-card" onclick="ArticleManager.viewRelatedArticle('${article.id}')">
                <div class="news-image" style="background-image: url('${article.image}')"></div>
                <div class="news-content">
                    <span class="news-category">${article.category}</span>
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-excerpt">${article.excerpt || article.content.substring(0, 100)}...</p>
                    <div class="news-meta">
                        <span>${this.formatDate(article.createdAt)}</span>
                        <span>Oleh: ${article.author}</span>
                    </div>
                </div>
            </article>
        `).join('');
    }

    static async loadSidebarContent() {
        try {
            await this.loadSidebarPopularNews();
            await this.loadSidebarCategories();
            this.initializeMobileSidebar();
        } catch (error) {
            console.error('Error loading sidebar content:', error);
        }
    }

    static async loadSidebarPopularNews() {
        try {
            const snapshot = await db.collection('articles')
                .where('status', '==', 'published')
                .orderBy('views', 'desc')
                .limit(5)
                .get();

            const popularArticles = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            }));

            const desktopContainer = document.getElementById('sidebarPopularNews');
            const mobileContainer = document.getElementById('mobilePopularNews');
            
            if (popularArticles.length === 0) {
                const emptyMessage = `
                    <div style="text-align: center; padding: 1rem; color: #718096;">
                        <p>Belum ada artikel populer</p>
                    </div>
                `;
                if (desktopContainer) desktopContainer.innerHTML = emptyMessage;
                if (mobileContainer) mobileContainer.innerHTML = emptyMessage;
                return;
            }
            
            const popularHTML = popularArticles.map(article => `
                <div class="popular-sidebar-item" onclick="ArticleManager.viewRelatedArticle('${article.id}')">
                    <div class="popular-sidebar-image" style="background-image: url('${article.image}')"></div>
                    <div class="popular-sidebar-content">
                        <h4 class="popular-sidebar-title">${article.title}</h4>
                        <div class="popular-sidebar-meta">
                            ${article.views || 0} dilihat • ${this.formatRelativeTime(article.createdAt)}
                        </div>
                    </div>
                </div>
            `).join('');
            
            if (desktopContainer) desktopContainer.innerHTML = popularHTML;
            if (mobileContainer) mobileContainer.innerHTML = popularHTML;
        } catch (error) {
            console.error('Error loading popular news:', error);
        }
    }

    static async loadSidebarCategories() {
        try {
            let categoriesData = [];
            try {
                const snapshot = await db.collection('categories').where('isActive', '==', true).orderBy('order').get();
                categoriesData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (error) {
                categoriesData = ['Pemerintahan', 'Pertanian', 'Kesehatan', 'Pendidikan', 'Ekonomi', 'Keamanan', 'Pembangunan', 'Lingkungan', 'Sosial']
                        .map(name => ({ id: name, name }));
            }

            const desktopContainer = document.getElementById('sidebarCategories');
            const mobileContainer = document.getElementById('mobileCategories');
            
            const categoriesWithCounts = await Promise.all(
                categoriesData.map(async (category) => {
                    const snapshot = await db.collection('articles')
                        .where('status', '==', 'published')
                        .where('category', '==', category.name)
                        .get();
                    return {
                        ...category,
                        count: snapshot.size
                    };
                })
            );
            
            const categoriesHTML = categoriesWithCounts.map(category => {
                return `
                    <li class="categories-sidebar-item">
                        <a href="#" class="categories-sidebar-link" onclick="ArticleManager.filterByCategory('${category.name}')">
                            ${category.name}
                            <span class="category-sidebar-count">${category.count}</span>
                        </a>
                    </li>
                `;
            }).join('');
            
            if (desktopContainer) desktopContainer.innerHTML = categoriesHTML;
            if (mobileContainer) mobileContainer.innerHTML = categoriesHTML;
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    static initializeMobileSidebar() {
        const desktopPopular = document.getElementById('sidebarPopularNews');
        const mobilePopular = document.getElementById('mobilePopularNews');
        const desktopCategories = document.getElementById('sidebarCategories');
        const mobileCategories = document.getElementById('mobileCategories');
        
        if (desktopPopular && mobilePopular) {
            mobilePopular.innerHTML = desktopPopular.innerHTML;
        }
        
        if (desktopCategories && mobileCategories) {
            mobileCategories.innerHTML = desktopCategories.innerHTML;
        }
    }

    static formatRelativeTime(dateString) {
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

    static viewRelatedArticle(articleId) {
        localStorage.setItem('currentArticle', articleId);
        window.location.reload();
    }

    static setupShareButtons(article) {
        const currentUrl = window.location.href;
        const title = encodeURIComponent(article.title);
        
        const facebookBtn = document.getElementById('shareFacebook');
        if (facebookBtn) {
            facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${title}`;
            facebookBtn.target = '_blank';
        }
        
        const twitterBtn = document.getElementById('shareTwitter');
        if (twitterBtn) {
            twitterBtn.href = `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(currentUrl)}`;
            twitterBtn.target = '_blank';
        }
        
        const whatsappBtn = document.getElementById('shareWhatsapp');
        if (whatsappBtn) {
            whatsappBtn.href = `https://wa.me/?text=${title}%20${encodeURIComponent(currentUrl)}`;
            whatsappBtn.target = '_blank';
        }
        
        const telegramBtn = document.getElementById('shareTelegram');
        if (telegramBtn) {
            telegramBtn.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${title}`;
            telegramBtn.target = '_blank';
        }
        
        const linkBtn = document.getElementById('shareLink');
        if (linkBtn) {
            linkBtn.addEventListener('click', function(e) {
                e.preventDefault();
                navigator.clipboard.writeText(currentUrl).then(() => {
                    alert('Link artikel berhasil disalin!');
                }).catch(() => {
                    const textArea = document.createElement('textarea');
                    textArea.value = currentUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Link artikel berhasil disalin!');
                });
            });
        }
    }

    static searchByTag(tag) {
        localStorage.setItem('searchTerm', tag);
        window.open('search.html', '_blank');
    }

    static filterByCategory(category) {
        localStorage.setItem('currentFilter', category);
        window.location.href = 'index.html';
    }

    static setupEventListeners() {
        const mobileMenu = document.querySelector('.mobile-menu');
        const nav = document.querySelector('nav ul');
        
        if (mobileMenu && nav) {
            mobileMenu.addEventListener('click', function() {
                nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
            });
        }
    }

    static showArticleNotFound() {
        document.querySelector('.article-content').innerHTML = `
            <div class="container" style="text-align: center; padding: 4rem 0;">
                <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #e53e3e; margin-bottom: 1rem;"></i>
                <h2 style="color: #2d3748; margin-bottom: 1rem;">Artikel Tidak Ditemukan</h2>
                <p style="color: #718096; margin-bottom: 2rem;">Artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
                <a href="index.html" class="btn" style="padding: 0.75rem 2rem;">Kembali ke Beranda</a>
            </div>
        `;
    }
}

// Initialize article manager
document.addEventListener('DOMContentLoaded', function() {
    ArticleManager.init();
});

// Make available globally
if (typeof window !== 'undefined') {
    window.ArticleManager = ArticleManager;
}