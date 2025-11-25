// js/cloudinary-config.js
console.log('Memuat Cloudinary Configuration...');

const CLOUDINARY_CONFIG = {
    cloud_name: 'dgpkt6asi', // Ganti dengan cloud name Anda dari dashboard Cloudinary
    upload_preset: 'desamedia_upload' // Upload preset yang dibuat di Cloudinary
};

// Validasi config
if (!CLOUDINARY_CONFIG.cloud_name || CLOUDINARY_CONFIG.cloud_name === 'your-cloud-name') {
    console.error('❌ Cloudinary cloud_name belum dikonfigurasi!');
    console.error('👉 Silakan daftar di cloudinary.com dan ganti cloud_name di file ini');
} else {
    console.log('✅ Cloudinary config loaded:', CLOUDINARY_CONFIG);
}

// Export untuk penggunaan global
window.CLOUDINARY_CONFIG = CLOUDINARY_CONFIG;