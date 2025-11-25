// utils.js - Utility functions untuk DesaMedia
console.log('Memuat utils.js...');

const DesaMediaUtils = {
    // Format tanggal ke format Indonesia
    formatDate: function(dateString) {
        try {
            const date = new Date(dateString);
            // Handle Firebase Timestamp
            if (dateString && typeof dateString.toDate === 'function') {
                return this.formatDate(dateString.toDate());
            }
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            return date.toLocaleDateString('id-ID', options);
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Tanggal tidak tersedia';
        }
    },

    // Format tanggal lengkap dengan waktu
    formatDateTime: function(dateString) {
        try {
            const date = new Date(dateString);
            // Handle Firebase Timestamp
            if (dateString && typeof dateString.toDate === 'function') {
                return this.formatDateTime(dateString.toDate());
            }
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('id-ID', options);
        } catch (e) {
            console.error('Error formatting date time:', e);
            return 'Tanggal tidak tersedia';
        }
    },

    // Hitung waktu baca artikel
    calculateReadTime: function(content) {
        if (!content) return 1;
        
        // Remove HTML tags if content contains HTML
        const textOnly = content.replace(/<[^>]*>/g, '');
        const wordsPerMinute = 200;
        const words = textOnly.split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return Math.max(1, minutes);
    },

    // Escape HTML untuk mencegah XSS
    escapeHtml: function(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    // Debounce function untuk search
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    // Validasi email - PERBAIKAN: Fungsi validasi email yang benar
    validateEmail: function(email) {
        if (!email) return false;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validasi URL
    validateUrl: function(url) {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Format angka dengan pemisah ribuan
    formatNumber: function(num) {
        if (!num && num !== 0) return '0';
        return new Intl.NumberFormat('id-ID').format(num);
    },

    // Potong teks dengan elipsis
    truncateText: function(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    // Dapatkan icon berdasarkan kategori
    getCategoryIcon: function(category) {
        const icons = {
            'Pemerintahan': '🏛️',
            'Pertanian': '🌾',
            'Kesehatan': '🏥',
            'Pendidikan': '📚',
            'Ekonomi': '💼',
            'Keamanan': '🛡️',
            'Pembangunan': '🏗️',
            'Lingkungan': '🌳',
            'Sosial': '👥'
        };
        return icons[category] || '📰';
    },

    // Format konten artikel
    formatContent: function(content) {
        if (!content) return '<p>Konten tidak tersedia.</p>';
        
        // Jika sudah mengandung HTML, return langsung
        if (content.includes('<') && content.includes('>')) {
            return content;
        }
        
        // Format teks biasa ke HTML
        let formattedContent = '';
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            if (!line) continue;
            
            // Heading detection
            if (line.startsWith('# ')) {
                formattedContent += `<h1>${line.substring(2)}</h1>`;
            } else if (line.startsWith('## ')) {
                formattedContent += `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith('### ')) {
                formattedContent += `<h3>${line.substring(4)}</h3>`;
            } 
            // Blockquote detection
            else if (line.startsWith('> ')) {
                formattedContent += `<blockquote>${line.substring(2)}</blockquote>`;
            }
            // List detection
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                if (i === 0 || !lines[i-1].trim().startsWith('- ')) {
                    formattedContent += '<ul>';
                }
                formattedContent += `<li>${line.substring(2)}</li>`;
                if (i === lines.length - 1 || !lines[i+1].trim().startsWith('- ')) {
                    formattedContent += '</ul>';
                }
            }
            // Bold and italic
            else {
                // Simple markdown-like formatting
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
                line = line.replace(/_(.*?)_/g, '<em>$1</em>');
                line = line.replace(/`(.*?)`/g, '<code>$1</code>');
                
                // Link detection
                line = line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
                
                formattedContent += `<p>${line}</p>`;
            }
        }
        
        return formattedContent || `<p>${content}</p>`;
    },

    // Show notification
    showNotification: function(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.desamedia-notification');
        existingNotifications.forEach(notif => notif.remove());
        
        const notification = document.createElement('div');
        notification.className = `desamedia-notification notification-${type}`;
        
        const icon = {
            'info': 'fa-info-circle',
            'success': 'fa-check-circle',
            'warning': 'fa-exclamation-triangle',
            'error': 'fa-exclamation-circle'
        }[type] || 'fa-info-circle';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            font-family: 'Inter', sans-serif;
        `;
        
        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
        `;
        
        notification.querySelector('.notification-close').style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
        `;
        
        notification.querySelector('.notification-close').addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(255,255,255,0.2)';
        });
        
        notification.querySelector('.notification-close').addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        // Add keyframes for animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
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
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        });
        
        return notification;
    },

    // Get notification color based on type
    getNotificationColor: function(type) {
        const colors = {
            'info': '#1a365d',
            'success': '#38a169',
            'warning': '#d69e2e',
            'error': '#e53e3e'
        };
        return colors[type] || colors.info;
    },

    // Format file size
    formatFileSize: function(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Validate file type
    validateFileType: function(file, allowedTypes) {
        if (!file || !allowedTypes || allowedTypes.length === 0) return true;
        return allowedTypes.includes(file.type);
    },

    // Validate file size
    validateFileSize: function(file, maxSizeInMB) {
        if (!file || !maxSizeInMB) return true;
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        return file.size <= maxSizeInBytes;
    },

    // Generate random ID
    generateId: function(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    // Check if device is mobile
    isMobile: function() {
        return window.innerWidth <= 768;
    },

    // Check if device is tablet
    isTablet: function() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },

    // Check if device is desktop
    isDesktop: function() {
        return window.innerWidth > 1024;
    },

    // Add loading state to element
    setLoading: function(element, isLoading) {
        if (!element) return;
        
        if (isLoading) {
            element.disabled = true;
            const originalText = element.innerHTML;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        } else {
            element.disabled = false;
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.innerHTML = originalText;
            }
        }
    },

    // Remove loading state from element
    removeLoading: function(element) {
        this.setLoading(element, false);
    },

    // Copy text to clipboard
    copyToClipboard: function(text) {
        return new Promise((resolve, reject) => {
            if (!text) {
                reject(new Error('Teks tidak boleh kosong'));
                return;
            }
            
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(resolve).catch(reject);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    resolve();
                } catch (err) {
                    reject(err);
                }
                document.body.removeChild(textArea);
            }
        });
    },

    // Get query parameters from URL
    getQueryParams: function() {
        const params = {};
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    },

    // Set query parameters in URL
    setQueryParams: function(params) {
        if (!params) return;
        
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });
        window.history.replaceState({}, '', url);
    },

    // Format relative time (e.g., "2 hours ago")
    formatRelativeTime: function(dateString) {
        if (!dateString) return 'beberapa waktu lalu';
        
        try {
            const date = new Date(dateString);
            // Handle Firebase Timestamp
            if (dateString && typeof dateString.toDate === 'function') {
                return this.formatRelativeTime(dateString.toDate());
            }
            
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffMinutes < 1) return 'baru saja';
            if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
            if (diffHours < 24) return `${diffHours} jam lalu`;
            if (diffDays === 1) return '1 hari lalu';
            if (diffDays < 7) return `${diffDays} hari lalu`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
            return `${Math.floor(diffDays / 30)} bulan lalu`;
        } catch (e) {
            console.error('Error formatting relative time:', e);
            return 'beberapa waktu lalu';
        }
    },

    // Sanitize HTML (basic)
    sanitizeHtml: function(html) {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    },

    // Get current year
    getCurrentYear: function() {
        return new Date().getFullYear();
    },

    // Scroll to element smoothly
    scrollToElement: function(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },

    // Toggle element visibility
    toggleVisibility: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    },

    // Show element
    showElement: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'block';
        }
    },

    // Hide element
    hideElement: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },

    // Add class to element
    addClass: function(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add(className);
        }
    },

    // Remove class from element
    removeClass: function(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove(className);
        }
    },

    // Toggle class on element
    toggleClass: function(elementId, className) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.toggle(className);
        }
    },

    // PERBAIKAN: Helper untuk mendapatkan initial user name
    getUserInitial: function(name) {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    },

    // PERBAIKAN: Helper untuk format nama penulis
    formatAuthorName: function(name) {
        if (!name) return 'Penulis';
        return name.trim();
    },

    // PERBAIKAN: Helper untuk memeriksa apakah user sudah login
    isUserLoggedIn: function() {
        try {
            const userData = localStorage.getItem('currentUser');
            return userData && JSON.parse(userData);
        } catch (error) {
            console.error('Error checking user login:', error);
            return false;
        }
    },

    // PERBAIKAN: Helper untuk mendapatkan data user
    getCurrentUser: function() {
        try {
            const userData = localStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // PERBAIKAN: Helper untuk logout
    logout: function() {
        try {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('editingArticleId');
            if (typeof auth !== 'undefined' && auth.signOut) {
                auth.signOut();
            }
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error during logout:', error);
            window.location.href = 'login.html';
        }
    },

    // PERBAIKAN: Helper untuk menampilkan error
    showError: function(message) {
        this.showNotification(message, 'error');
    },

    // PERBAIKAN: Helper untuk menampilkan success
    showSuccess: function(message) {
        this.showNotification(message, 'success');
    },

    // PERBAIKAN: Helper untuk menampilkan warning
    showWarning: function(message) {
        this.showNotification(message, 'warning');
    },

    // PERBAIKAN: Helper untuk menampilkan info
    showInfo: function(message) {
        this.showNotification(message, 'info');
    },

    // PERBAIKAN: Helper untuk menampilkan loading
    showLoading: function(message = 'Memuat...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        if (loadingText) {
            loadingText.textContent = message;
        }
    },

    // PERBAIKAN: Helper untuk menyembunyikan loading
    hideLoading: function() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    },

    // PERBAIKAN: Helper untuk validasi file gambar
    validateImageFile: function(file) {
        // Check file type
        if (!file.type.match('image.*')) {
            this.showError('Hanya file gambar yang diizinkan (JPG, PNG, GIF)');
            return false;
        }
        
        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            this.showError('Ukuran file maksimal 2MB');
            return false;
        }
        
        return true;
    },

    // PERBAIKAN: Helper untuk mendapatkan gambar default berdasarkan kategori
    getDefaultImageByCategory: function(category) {
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
    },

    // PERBAIKAN: Helper untuk setup navigation
    setupNavigation: function() {
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
                this.updatePageTitle(sectionName);
            }.bind(this));
        });
    },

    // PERBAIKAN: Helper untuk update page title
    updatePageTitle: function(sectionName) {
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
    },

    // PERBAIKAN: Helper untuk setup form handlers
    setupFormHandlers: function() {
        // Article form
        const articleForm = document.getElementById('articleForm');
        if (articleForm) {
            articleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (typeof window.saveArticle === 'function') {
                    await window.saveArticle(e);
                }
            });
        }
        
        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (typeof window.saveProfile === 'function') {
                    await window.saveProfile(e);
                }
            });
        }
    },

    // PERBAIKAN: Helper untuk upload gambar utama
    uploadMainImage: async function(file) {
        try {
            console.log('Uploading main image to Firebase...');
            
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error('Firebase Storage tidak tersedia');
            }
            
            // Validate file first
            if (!this.validateImageFile(file)) {
                throw new Error('File tidak valid');
            }
            
            // Upload to Firebase Storage
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`article-images/${Date.now()}-${file.name}`);
            const snapshot = await imageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log('Main image uploaded successfully:', downloadURL);
            return {
                success: true,
                url: downloadURL,
                filename: file.name,
                size: file.size,
                type: file.type
            };
            
        } catch (error) {
            console.error('Error uploading main image:', error);
            
            let errorMessage = 'Error mengupload gambar utama: ' + error.message;
            if (error.message.includes('storage/unauthorized')) {
                errorMessage = 'Tidak memiliki izin untuk mengupload gambar.';
            } else if (error.message.includes('storage/retry-limit-exceeded')) {
                errorMessage = 'Upload gagal setelah beberapa percobaan. Periksa koneksi internet Anda.';
            }
            
            return {
                success: false,
                error: errorMessage,
                originalError: error
            };
        }
    },

    // PERBAIKAN: Helper untuk upload gambar konten
    uploadContentImage: async function(file, altText = 'Gambar artikel') {
        try {
            console.log('Uploading content image to Firebase...');
            
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error('Firebase Storage tidak tersedia');
            }
            
            // Validate file first
            if (!this.validateImageFile(file)) {
                throw new Error('File tidak valid');
            }
            
            // Upload to Firebase Storage
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child(`content-images/${Date.now()}-${file.name}`);
            const snapshot = await imageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log('Content image uploaded successfully:', downloadURL);
            return { 
                success: true,
                url: downloadURL, 
                alt: altText,
                filename: file.name,
                size: file.size,
                type: file.type
            };
            
        } catch (error) {
            console.error('Error uploading content image:', error);
            
            let errorMessage = 'Error mengupload gambar: ' + error.message;
            if (error.message.includes('storage/unauthorized')) {
                errorMessage = 'Tidak memiliki izin untuk mengupload gambar.';
            } else if (error.message.includes('storage/retry-limit-exceeded')) {
                errorMessage = 'Upload gagal setelah beberapa percobaan. Periksa koneksi internet Anda.';
            } else if (error.message.includes('storage/canceled')) {
                errorMessage = 'Upload dibatalkan.';
            }
            
            return {
                success: false,
                error: errorMessage,
                originalError: error
            };
        }
    },

    // PERBAIKAN: Helper untuk membersihkan preview gambar
    clearImagePreview: function() {
        const preview = document.getElementById('imagePreview');
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('articleImageFile');
        
        if (preview) preview.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'block';
        if (fileInput) fileInput.value = '';
    },

    // PERBAIKAN: Helper untuk menambah tag
    addTag: function(tag) {
        console.log('Adding tag:', tag);
        const tagsInput = document.getElementById('articleTags');
        if (!tagsInput) {
            console.error('Tags input not found!');
            return;
        }
        
        const currentTags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
        
        if (!currentTags.includes(tag)) {
            if (currentTags.length > 0) {
                tagsInput.value = currentTags.join(', ') + ', ' + tag;
            } else {
                tagsInput.value = tag;
            }
            console.log('Tag added, current tags:', tagsInput.value);
        } else {
            console.log('Tag already exists, skipping...');
        }
        
        tagsInput.focus();
    },

    // PERBAIKAN: Helper untuk reset form artikel
    resetArticleForm: function() {
        const articleForm = document.getElementById('articleForm');
        if (articleForm) {
            articleForm.reset();
        }
        this.clearImagePreview();
        
        const editorContent = document.getElementById('articleContent');
        if (editorContent) {
            editorContent.innerHTML = '';
        }
        
        localStorage.removeItem('editingArticleId');
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = 'Tulis Artikel Baru';
        }
        
        this.showNotification('Form berhasil direset', 'info');
    },

    // PERBAIKAN: Helper untuk memuat data profil
    loadProfileData: async function() {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                console.error('No current user found');
                return;
            }

            console.log('Loading profile data for user:', currentUser.uid);
            
            const userDoc = await db.collection('users').doc(currentUser.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('Profile data loaded:', userData);
                
                // Fill form with user data
                document.getElementById('profileName').value = userData.name || '';
                document.getElementById('profileUsername').value = userData.username || '';
                document.getElementById('profileEmail').value = userData.email || '';
                document.getElementById('profileBio').value = userData.bio || '';
                document.getElementById('profilePhoto').value = userData.photo || '';
                
                // Update photo preview
                if (userData.photo) {
                    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
                    if (profilePhotoPreview) {
                        profilePhotoPreview.style.backgroundImage = `url('${userData.photo}')`;
                        profilePhotoPreview.classList.add('show');
                    }
                }
                
                console.log('Profile form populated successfully');
            } else {
                console.log('No user data found in Firestore, using default values');
                // Set default values if no user data exists
                document.getElementById('profileName').value = currentUser.displayName || '';
                document.getElementById('profileUsername').value = currentUser.email?.split('@')[0] || '';
                document.getElementById('profileEmail').value = currentUser.email || '';
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            // Fallback to current user data
            const currentUser = this.getCurrentUser();
            if (currentUser) {
                document.getElementById('profileName').value = currentUser.displayName || '';
                document.getElementById('profileUsername').value = currentUser.email?.split('@')[0] || '';
                document.getElementById('profileEmail').value = currentUser.email || '';
            }
        }
    },

    // PERBAIKAN: Helper untuk menyimpan profil
    saveProfile: async function() {
        try {
            this.showLoading('Menyimpan profil...');
            
            const name = document.getElementById('profileName').value;
            const username = document.getElementById('profileUsername').value;
            const email = document.getElementById('profileEmail').value;
            const bio = document.getElementById('profileBio').value;
            const photo = document.getElementById('profilePhoto').value;
            
            // Validasi form
            if (!name || !username || !email) {
                throw new Error('Nama, username, dan email wajib diisi');
            }
            
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                throw new Error('User tidak terautentikasi');
            }
            
            // Prepare user data
            const userData = {
                name: name.trim(),
                username: username.trim(),
                email: email.trim(),
                bio: bio.trim(),
                photo: photo.trim(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            console.log('Saving profile data:', userData);
            
            // Update data user di Firestore
            await db.collection('users').doc(currentUser.uid).set(userData, { merge: true });
            
            // Update currentUser data
            currentUser.displayName = name;
            currentUser.email = email;
            
            // Update UI
            document.getElementById('userName').textContent = name;
            document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
            
            // Update localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            this.hideLoading();
            this.showSuccess('Profil berhasil diperbarui!');
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showError(`Gagal menyimpan profil: ${error.message}`);
            this.hideLoading();
        }
    }
};

// Make utility functions available globally
window.DesaMediaUtils = DesaMediaUtils;

// Also make commonly used functions available directly
window.showError = DesaMediaUtils.showError;
window.showSuccess = DesaMediaUtils.showSuccess;
window.showWarning = DesaMediaUtils.showWarning;
window.showInfo = DesaMediaUtils.showInfo;
window.showNotification = DesaMediaUtils.showNotification;
window.formatDate = DesaMediaUtils.formatDate;
window.formatDateTime = DesaMediaUtils.formatDateTime;
window.formatRelativeTime = DesaMediaUtils.formatRelativeTime;
window.showLoading = DesaMediaUtils.showLoading;
window.hideLoading = DesaMediaUtils.hideLoading;
window.validateImageFile = DesaMediaUtils.validateImageFile;
window.clearImagePreview = DesaMediaUtils.clearImagePreview;
window.addTag = DesaMediaUtils.addTag;
window.loadProfileData = DesaMediaUtils.loadProfileData;
window.saveProfile = DesaMediaUtils.saveProfile;

console.log('Utils.js berhasil dimuat');