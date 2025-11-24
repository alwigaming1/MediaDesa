// js/image-upload.js
class ImageUploader {
    static init() {
        console.log('Initializing ImageUploader...');
        
        // Setup untuk form utama
        this.setupImageUpload('articleImageFile', 'imagePreview', 'previewImg', 'uploadArea');
        
        // Setup untuk modal (jika ada)
        this.setupImageUpload('modalArticleImageFile', 'modalImagePreview', 'modalPreviewImg', 'modalUploadArea');
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
                if (file.size > 2 * 1024 * 1024) { // 2MB
                    alert('Ukuran file maksimal 2MB');
                    return;
                }
                
                if (!file.type.match('image.*')) {
                    alert('Hanya file gambar yang diizinkan');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    preview.style.display = 'block';
                    uploadArea.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    static getUploadedImage(type = 'article') {
        if (type === 'modal') {
            const previewImg = document.getElementById('modalPreviewImg');
            return previewImg ? previewImg.src : null;
        } else {
            const previewImg = document.getElementById('previewImg');
            return previewImg ? previewImg.src : null;
        }
    }
    
    static clearImagePreview(type = 'article') {
        if (type === 'modal') {
            const fileInput = document.getElementById('modalArticleImageFile');
            const preview = document.getElementById('modalImagePreview');
            const uploadArea = document.getElementById('modalUploadArea');
            
            if (fileInput) fileInput.value = '';
            if (preview) preview.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'block';
        } else {
            const fileInput = document.getElementById('articleImageFile');
            const preview = document.getElementById('imagePreview');
            const uploadArea = document.getElementById('uploadArea');
            
            if (fileInput) fileInput.value = '';
            if (preview) preview.style.display = 'none';
            if (uploadArea) uploadArea.style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ImageUploader.init();
});

// Make available globally
if (typeof window !== 'undefined') {
    window.ImageUploader = ImageUploader;
}