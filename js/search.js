// search.js - Search functionality
console.log('Memuat search.js...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Halaman pencarian dimuat');
    
    try {
        const searchTerm = localStorage.getItem('searchTerm');
        if (searchTerm) {
            performSearch(searchTerm);
        } else {
            showNoResults('Silakan masukkan kata kunci pencarian');
        }
        
        setupSearchListener();
    } catch (error) {
        console.error('Error loading search page:', error);
    }
});

function performSearch(searchTerm) {
    try {
        const articles = JSON.parse(localStorage.getItem('articles')) || [];
        const results = searchArticles(searchTerm, articles);
        displaySearchResults(results, searchTerm);
    } catch (error) {
        console.error('Error performing search:', error);
    }
}

function searchArticles(searchTerm, articles) {
    const searchLower = searchTerm.toLowerCase();
    return articles.filter(article => 
        article.status === 'published' && (
            article.title.toLowerCase().includes(searchLower) ||
            article.content.toLowerCase().includes(searchLower) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
            article.category.toLowerCase().includes(searchLower) ||
            article.author.toLowerCase().includes(searchLower)
        )
    );
}

function displaySearchResults(results, searchTerm) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    const searchQuery = document.getElementById('searchQuery');
    const noResults = document.getElementById('noResults');
    
    if (!resultsContainer || !resultsCount) return;
    
    // Update search info
    resultsCount.textContent = `Ditemukan ${results.length} hasil untuk`;
    if (searchQuery) {
        searchQuery.innerHTML = `"<strong>${DesaMediaUtils.escapeHtml(searchTerm)}</strong>"`;
    }
    
    if (results.length === 0) {
        resultsContainer.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    resultsContainer.style.display = 'block';
    if (noResults) noResults.style.display = 'none';
    
    // Display results
    resultsContainer.innerHTML = `
        <div class="news-list">
            ${results.map(article => `
                <article class="news-item" onclick="viewArticle('${article.id}')">
                    <div class="news-item-image" style="background-image: url('${article.image}')"></div>
                    <div class="news-item-content">
                        <span class="news-category" style="display: inline-block; padding: 0.25rem 0.75rem; background-color: var(--primary-light); color: var(--white); font-size: 0.75rem; border-radius: 4px; margin-bottom: 0.75rem;">${article.category}</span>
                        <h3 class="news-item-title">${DesaMediaUtils.escapeHtml(article.title)}</h3>
                        <p class="news-item-excerpt">${DesaMediaUtils.escapeHtml(article.content.substring(0, 150))}...</p>
                        <div class="news-item-meta">
                            <span><i class="far fa-calendar"></i> ${DesaMediaUtils.formatDate(article.createdAt)}</span>
                            <span><i class="far fa-user"></i> ${article.author}</span>
                            <span><i class="far fa-eye"></i> ${article.views || 0} dilihat</span>
                        </div>
                    </div>
                </article>
            `).join('')}
        </div>
    `;
}

function setupSearchListener() {
    const searchInput = document.getElementById('mainSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    localStorage.setItem('searchTerm', searchTerm);
                    performSearch(searchTerm);
                }
            }
        });
        
        // Set initial value from localStorage
        const savedSearchTerm = localStorage.getItem('searchTerm');
        if (savedSearchTerm) {
            searchInput.value = savedSearchTerm;
        }
    }
}

function showNoResults(message) {
    const resultsContainer = document.getElementById('searchResultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    const noResults = document.getElementById('noResults');
    
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (resultsCount) resultsCount.textContent = message;
    if (noResults) noResults.style.display = 'block';
}

// Make functions globally available
window.viewArticle = function(articleId) {
    localStorage.setItem('currentArticle', articleId);
    window.open('article.html', '_blank');
};

window.filterByCategory = function(category) {
    localStorage.setItem('currentFilter', category);
    window.location.href = 'index.html';
};