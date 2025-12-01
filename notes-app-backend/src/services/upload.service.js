const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

class UploadService {
  static async uploadFile(file, folder = 'notes-attachments') {
    try {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
      });

      await fs.unlink(file.tempFilePath);

      return {
        url: result.secure_url,
        cloudinaryId: result.public_id,
        format: result.format,
        size: result.bytes,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Eroare la încărcarea fișierului');
    }
  }

  static async deleteFile(cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(cloudinaryId);
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }

  static getFileType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('document') || mimetype.includes('word')) return 'document';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'spreadsheet';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
    return 'other';
  }

  static validateFile(file, maxSize = 50 * 1024 * 1024) {
    if (!file) {
      throw new Error('Niciun fișier încărcat');
    }

    if (file.size > maxSize) {
      throw new Error(`Fișierul este prea mare. Maxim: ${maxSize / (1024 * 1024)}MB`);
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Tip de fișier neacceptat');
    }

    return true;
  }
}

module.exports = UploadService;