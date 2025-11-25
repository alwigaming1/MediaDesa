// js/image-upload.js - Enhanced untuk upload gambar dalam konten
class ImageUploader {
    static init() {
        console.log('Initializing ImageUploader...');
        
        // Setup untuk form utama
        this.setupImageUpload('articleImageFile', 'imagePreview', 'previewImg', 'uploadArea');
        
        // Setup untuk gambar dalam konten
        this.setupContentImageUpload();
        
        console.log('ImageUploader initialized successfully');
    }
    
    static setupImageUpload(fileInputId, previewId, previewImgId, uploadAreaId) {
        const fileInput = document.getElementById(fileInputId);
        const preview = document.getElementById(previewId);
        const previewImg = document.getElementById(previewImgId);
        const uploadArea = document.getElementById(uploadAreaId);
        
        if (!fileInput || !preview || !previewImg || !uploadArea) {
            console.log(`Element not found for ${fileInputId}, skipping...`);
            return;
        }
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!ImageUploader.validateFile(file)) {
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    preview.style.display = 'block';
                    uploadArea.style.display = 'none';
                    
                    // Show success message
                    if (typeof window.showNotification === 'function') {
                        window.showNotification('Gambar berhasil diupload!', 'success');
                    }
                };
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    preview.style.display = 'block';
                    uploadArea.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Setup drag and drop
        if (uploadArea) {
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
                    const file = e.dataTransfer.files[0];
                    if (ImageUploader.validateFile(file)) {
                        fileInput.files = e.dataTransfer.files;
                        const event = new Event('change');
                        fileInput.dispatchEvent(event);
                    }
                }
            });
        }
        
        console.log(`Image upload setup complete for ${fileInputId}`);
    }
    
    static setupContentImageUpload() {
        const contentFileInput = document.getElementById('contentImageFile');
        const contentUploadArea = document.getElementById('contentImageUploadArea');
        const contentPreview = document.getElementById('contentImagePreview');
        const contentPreviewImg = document.getElementById('contentPreviewImg');
        const insertBtn = document.getElementById('insertImageConfirmBtn');
        
        if (!contentFileInput || !contentUploadArea) {
            console.log('Content image upload elements not found, skipping...');
            return;
        }
        
        contentUploadArea.addEventListener('click', () => {
            contentFileInput.click();
        });
        
        contentFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!ImageUploader.validateFile(file)) {
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (contentPreviewImg) {
                        contentPreviewImg.src = e.target.result;
                    }
                    if (contentPreview) {
                        contentPreview.style.display = 'block';
                    }
                    if (insertBtn) {
                        insertBtn.disabled = false;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Setup drag and drop for content upload
        contentUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            contentUploadArea.classList.add('dragover');
        });
        
        contentUploadArea.addEventListener('dragleave', () => {
            contentUploadArea.classList.remove('dragover');
        });
        
        contentUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            contentUploadArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                const file = e.dataTransfer.files[0];
                if (ImageUploader.validateFile(file)) {
                    contentFileInput.files = e.dataTransfer.files;
                    const event = new Event('change');
                    contentFileInput.dispatchEvent(event);
                }
            }
        });
        
        console.log('Content image upload setup complete');
    }
    
    static validateFile(file) {
        // Check file type
        if (!file.type.match('image.*')) {
            const errorMsg = 'Hanya file gambar yang diizinkan (JPG, PNG, GIF)';
            if (typeof window.showError === 'function') {
                window.showError(errorMsg);
            } else {
                alert(errorMsg);
            }
            return false;
        }
        
        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            const errorMsg = 'Ukuran file maksimal 2MB';
            if (typeof window.showError === 'function') {
                window.showError(errorMsg);
            } else {
                alert(errorMsg);
            }
            return false;
        }
        
        return true;
    }
    
    static getUploadedImage(type = 'article') {
        if (type === 'modal') {
            const previewImg = document.getElementById('contentPreviewImg');
            return previewImg ? previewImg.src : null;
        } else {
            const previewImg = document.getElementById('previewImg');
            return previewImg ? previewImg.src : null;
        }
    }
    
    static clearImagePreview(type = 'article') {
        if (type === 'modal') {
            const fileInput = document.getElementById('contentImageFile');
            const preview = document.getElementById('contentImagePreview');
            const uploadArea = document.getElementById('contentImageUploadArea');
            const insertBtn = document.getElementById('insertImageConfirmBtn');
            
            if (fileInput) fileInput.value = '';
            if (preview) preview.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'block';
            if (insertBtn) insertBtn.disabled = true;
        } else {
            const fileInput = document.getElementById('articleImageFile');
            const preview = document.getElementById('imagePreview');
            const uploadArea = document.getElementById('uploadArea');
            
            if (fileInput) fileInput.value = '';
            if (preview) preview.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'block';
        }
    }
    
    // Method untuk upload gambar konten ke Firebase Storage
    static async uploadContentImage(file, altText = 'Gambar artikel') {
        try {
            console.log('Uploading content image to Firebase...');
            
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error('Firebase Storage tidak tersedia');
            }
            
            // Validate file first
            if (!this.validateFile(file)) {
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
    }
    
    // Method untuk upload gambar utama artikel
    static async uploadMainImage(file) {
        try {
            console.log('Uploading main image to Firebase...');
            
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error('Firebase Storage tidak tersedia');
            }
            
            // Validate file first
            if (!this.validateFile(file)) {
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
    }
    
    // Utility method to get file info
    static getFileInfo(file) {
        return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            formattedSize: this.formatFileSize(file.size)
        };
    }
    
    // Format file size untuk display
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Check if file is image
    static isImageFile(file) {
        return file && file.type.match('image.*');
    }
    
    // Get image dimensions
    static getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                resolve({
                    width: this.width,
                    height: this.height,
                    aspectRatio: this.width / this.height
                });
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
    
    // Compress image before upload (optional)
    static compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, quality);
            };
            
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for other components to initialize
    setTimeout(() => {
        try {
            ImageUploader.init();
            console.log('ImageUploader initialized successfully');
        } catch (error) {
            console.error('Error initializing ImageUploader:', error);
        }
    }, 100);
});

// Make available globally
if (typeof window !== 'undefined') {
    window.ImageUploader = ImageUploader;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUploader;
}