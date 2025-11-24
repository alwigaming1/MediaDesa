// article.js - Enhanced editor untuk konten artikel
class ArticleEditor {
    static init() {
        console.log('Initializing ArticleEditor...');
        this.setupEditorListeners();
        this.setupFormattingButtons();
    }

    static setupEditorListeners() {
        // Auto-resize textarea
        const contentTextareas = ['articleContent', 'modalArticleContent'];
        
        contentTextareas.forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.addEventListener('input', this.autoResize);
                textarea.addEventListener('keydown', this.handleTabKey);
            }
        });
    }

    static setupFormattingButtons() {
        // Formatting buttons untuk editor sederhana
        this.setupFormattingButton('boldBtn', '**teks tebal**', '**', '**');
        this.setupFormattingButton('italicBtn', '_teks miring_', '_', '_');
        this.setupFormattingButton('underlineBtn', '<u>teks garis bawah</u>', '<u>', '</u>');
        this.setupFormattingButton('linkBtn', '[teks link](https://...)', '[', '](https://)');
        this.setupFormattingButton('listBtn', '- item list', '- ', '');
        this.setupFormattingButton('quoteBtn', '> kutipan', '> ', '');
    }

    static setupFormattingButton(buttonId, exampleText, beforeText, afterText) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                this.insertText(beforeText, afterText);
            });
            
            // Tooltip
            button.title = exampleText;
        }
    }

    static insertText(beforeText, afterText) {
        const activeTextarea = this.getActiveTextarea();
        if (!activeTextarea) return;

        const start = activeTextarea.selectionStart;
        const end = activeTextarea.selectionEnd;
        const selectedText = activeTextarea.value.substring(start, end);
        const newText = beforeText + selectedText + afterText;

        activeTextarea.value = activeTextarea.value.substring(0, start) + 
                              newText + 
                              activeTextarea.value.substring(end);

        // Set cursor position
        const newCursorPos = start + beforeText.length + selectedText.length + afterText.length;
        activeTextarea.setSelectionRange(newCursorPos, newCursorPos);
        activeTextarea.focus();

        // Trigger auto-resize
        this.autoResize({ target: activeTextarea });
    }

    static getActiveTextarea() {
        // Cari textarea yang sedang aktif/focus
        const textareas = ['articleContent', 'modalArticleContent'];
        for (let id of textareas) {
            const textarea = document.getElementById(id);
            if (textarea && document.activeElement === textarea) {
                return textarea;
            }
        }
        // Default ke articleContent jika tidak ada yang focus
        return document.getElementById('articleContent') || 
               document.getElementById('modalArticleContent');
    }

    static autoResize(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    static handleTabKey(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            // Insert tab character
            textarea.value = textarea.value.substring(0, start) + 
                           '    ' + 
                           textarea.value.substring(end);
            
            // Set cursor position after tab
            textarea.setSelectionRange(start + 4, start + 4);
        }
    }

    static formatContent(content) {
        if (!content) return '';
        
        // Convert simple markup to HTML
        return content
            // Bold: **teks** -> <strong>teks</strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic: _teks_ -> <em>teks</em>
            .replace(/_(.*?)_/g, '<em>$1</em>')
            // Underline: <u>teks</u> tetap
            // Links: [teks](url) -> <a href="url">teks</a>
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            // Lists: - item -> <li>item</li>
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            // Quotes: > teks -> <blockquote>teks</blockquote>
            .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
            // Paragraphs: double newline -> </p><p>
            .replace(/\n\n/g, '</p><p>')
            // Single newline -> <br>
            .replace(/\n/g, '<br>');
    }
}

// Initialize editor
document.addEventListener('DOMContentLoaded', function() {
    ArticleEditor.init();
});

// Make available globally
if (typeof window !== 'undefined') {
    window.ArticleEditor = ArticleEditor;
}

// Enhanced article display dengan Firebase
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Loading article with Firebase...');
    
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
                await incrementArticleViews(articleId);
                
                // Display the article
                displayArticleSulengkaStyle(article);
                loadRelatedArticles(article);
                loadSidebarContent();
                setupShareButtons(article);
                
            } else {
                showArticleNotFound();
            }
        } catch (error) {
            console.error('Error loading article:', error);
            showArticleNotFound();
        }
    } else {
        showArticleNotFound();
    }
    
    setupEventListeners();
});

// Pastikan fungsi incrementArticleViews ada
async function incrementArticleViews(articleId) {
    try {
        await db.collection('articles').doc(articleId).update({
            views: firebase.firestore.FieldValue.increment(1),
            lastViewed: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('View count incremented for article:', articleId);
    } catch (error) {
        console.error('Error incrementing views:', error);
    }
}

function displayArticleSulengkaStyle(article) {
    console.log('Displaying article in sulengka.id style:', article.title);
    
    // Update document title
    document.title = `${article.title} - DesaMedia`;
    
    // Update article content
    document.getElementById('articleCategory').textContent = article.category;
    document.getElementById('articleTitle').textContent = article.title;
    
    // Update meta information
    document.getElementById('metaAuthor').textContent = article.author;
    document.getElementById('metaDate').textContent = formatDateSulengka(article.createdAt);
    document.getElementById('metaViews').textContent = article.views || 0;
    document.getElementById('metaReadTime').textContent = article.readTime || calculateReadTime(article.content);
    
    // Update article image
    const articleImage = document.getElementById('articleImage');
    if (article.image) {
        articleImage.style.backgroundImage = `url('${article.image}')`;
    } else {
        articleImage.style.backgroundImage = `url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')`;
    }
    
    // Update article content with enhanced formatting
    document.getElementById('articleBody').innerHTML = formatContentSulengka(article.content);
    
    // Update tags
    updateTagsSulengka(article.tags);
    
    // Update author information
    updateAuthorSulengka(article.author);
}

function formatDateSulengka(dateString) {
    try {
        const date = new Date(dateString);
        const options = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('id-ID', options);
    } catch (e) {
        return 'Tanggal tidak tersedia';
    }
}

function formatContentSulengka(content) {
    if (!content) return '<p>Konten tidak tersedia.</p>';
    
    // Jika content sudah berupa HTML, langsung return
    if (content.includes('<')) {
        return content;
    }
    
    // Split content into paragraphs and format
    const paragraphs = content.split('\n\n');
    let formattedContent = '';
    
    paragraphs.forEach(paragraph => {
        if (paragraph.trim()) {
            // Check if paragraph is a heading (short and doesn't end with period)
            if (paragraph.length < 100 && !paragraph.includes('.') && paragraph.trim().length > 10) {
                formattedContent += `<h2>${paragraph.trim()}</h2>`;
            } else {
                formattedContent += `<p>${paragraph.trim()}</p>`;
            }
        }
    });
    
    return formattedContent;
}

function updateTagsSulengka(tags) {
    const tagsContainer = document.getElementById('articleTags');
    if (tags && tags.length > 0) {
        tagsContainer.innerHTML = tags.map(tag => 
            `<a href="#" class="tag" onclick="searchByTag('${tag}')">#${tag}</a>`
        ).join('');
    } else {
        tagsContainer.innerHTML = '<a href="#" class="tag">#BeritaDesa</a>';
    }
}

async function updateAuthorSulengka(authorName) {
    try {
        // Cari user berdasarkan username
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
        
        // Update avatar
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
        
        // Update name and bio
        authorNameElement.textContent = authorProfile.name || authorName;
        authorBioElement.textContent = authorProfile.bio || 'Penulis aktif di DesaMedia yang berdedikasi menyampaikan informasi terpercaya untuk masyarakat desa.';
    } catch (error) {
        console.error('Error loading author profile:', error);
        // Fallback
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

function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

async function loadRelatedArticles(currentArticle) {
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
            // Fallback to any recent articles
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
            
            displayRelatedArticles(recentArticles, document.getElementById('relatedNews'));
        } else {
            displayRelatedArticles(relatedArticles, document.getElementById('relatedNews'));
        }
    } catch (error) {
        console.error('Error loading related articles:', error);
        // Fallback: tampilkan pesan tidak ada artikel terkait
        document.getElementById('relatedNews').innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <p style="color: #718096;">Belum ada berita terkait</p>
            </div>
        `;
    }
}

function displayRelatedArticles(articles, container) {
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
        <article class="news-card" onclick="viewRelatedArticle('${article.id}')">
            <div class="news-image" style="background-image: url('${article.image}')"></div>
            <div class="news-content">
                <span class="news-category">${article.category}</span>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-excerpt">${article.excerpt || article.content.substring(0, 100)}...</p>
                <div class="news-meta">
                    <span>${formatDateSulengka(article.createdAt)}</span>
                    <span>Oleh: ${article.author}</span>
                </div>
            </div>
        </article>
    `).join('');
}

async function loadSidebarContent() {
    try {
        // Load popular news in sidebar (desktop dan mobile)
        await loadSidebarPopularNews();
        
        // Load categories in sidebar (desktop dan mobile)
        await loadSidebarCategories();
    } catch (error) {
        console.error('Error loading sidebar content:', error);
    }
}

async function loadSidebarPopularNews() {
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

        // Update desktop sidebar
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
            <div class="popular-sidebar-item" onclick="viewRelatedArticle('${article.id}')">
                <div class="popular-sidebar-image" style="background-image: url('${article.image}')"></div>
                <div class="popular-sidebar-content">
                    <h4 class="popular-sidebar-title">${article.title}</h4>
                    <div class="popular-sidebar-meta">
                        ${article.views || 0} dilihat • ${formatRelativeTime(article.createdAt)}
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

async function loadSidebarCategories() {
    try {
        let categoriesData = [];
        try {
            const snapshot = await db.collection('categories').where('isActive', '==', true).orderBy('order').get();
            categoriesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            // Fallback to default categories
            categoriesData = ['Pemerintahan', 'Pertanian', 'Kesehatan', 'Pendidikan', 'Ekonomi', 'Keamanan', 'Pembangunan', 'Lingkungan', 'Sosial']
                .map(name => ({ id: name, name }));
        }

        const desktopContainer = document.getElementById('sidebarCategories');
        const mobileContainer = document.getElementById('mobileCategories');
        
        // Get article counts for each category
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
                    <a href="#" class="categories-sidebar-link" onclick="filterByCategory('${category.name}')">
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

function viewRelatedArticle(articleId) {
    localStorage.setItem('currentArticle', articleId);
    window.location.reload();
}

function setupShareButtons(article) {
    const currentUrl = window.location.href;
    const title = encodeURIComponent(article.title);
    
    // Facebook
    const facebookBtn = document.getElementById('shareFacebook');
    if (facebookBtn) {
        facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${title}`;
        facebookBtn.target = '_blank';
    }
    
    // Twitter
    const twitterBtn = document.getElementById('shareTwitter');
    if (twitterBtn) {
        twitterBtn.href = `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(currentUrl)}`;
        twitterBtn.target = '_blank';
    }
    
    // WhatsApp
    const whatsappBtn = document.getElementById('shareWhatsapp');
    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/?text=${title}%20${encodeURIComponent(currentUrl)}`;
        whatsappBtn.target = '_blank';
    }
    
    // Telegram
    const telegramBtn = document.getElementById('shareTelegram');
    if (telegramBtn) {
        telegramBtn.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${title}`;
        telegramBtn.target = '_blank';
    }
    
    // Copy Link
    const linkBtn = document.getElementById('shareLink');
    if (linkBtn) {
        linkBtn.addEventListener('click', function(e) {
            e.preventDefault();
            navigator.clipboard.writeText(currentUrl).then(() => {
                alert('Link artikel berhasil disalin!');
            }).catch(() => {
                // Fallback for older browsers
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

function searchByTag(tag) {
    localStorage.setItem('searchTerm', tag);
    window.open('search.html', '_blank');
}

function filterByCategory(category) {
    localStorage.setItem('currentFilter', category);
    window.location.href = 'index.html';
}

function setupEventListeners() {
    // Mobile menu
    const mobileMenu = document.querySelector('.mobile-menu');
    const nav = document.querySelector('nav ul');
    
    if (mobileMenu && nav) {
        mobileMenu.addEventListener('click', function() {
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
        });
    }
}

function showArticleNotFound() {
    document.querySelector('.article-content').innerHTML = `
        <div class="container" style="text-align: center; padding: 4rem 0;">
            <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: #e53e3e; margin-bottom: 1rem;"></i>
            <h2 style="color: #2d3748; margin-bottom: 1rem;">Artikel Tidak Ditemukan</h2>
            <p style="color: #718096; margin-bottom: 2rem;">Artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
            <a href="index.html" class="btn" style="padding: 0.75rem 2rem;">Kembali ke Beranda</a>
        </div>
    `;
}