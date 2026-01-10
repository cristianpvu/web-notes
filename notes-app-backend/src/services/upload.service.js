const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

class UploadService {
  static async uploadFile(file, folder = 'notes-attachments') {
    try {
      let resourceType = 'auto';
      const uploadOptions = {
        folder: folder,
        use_filename: true,
        unique_filename: false, 
        resource_type: undefined
      };

      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
      } else {
        // Pentru PDF și documente
        resourceType = 'raw';
      }

      uploadOptions.resource_type = resourceType;

      const result = await cloudinary.uploader.upload(file.tempFilePath, uploadOptions);

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

  static async deleteFile(cloudinaryId, resourceType = 'image') {
    try {
      // Încearcă să șteargă cu resource_type specificat
      await cloudinary.uploader.destroy(cloudinaryId, { resource_type: resourceType });
      return true;
    } catch (error) {
      // Dacă eșuează, încearcă cu 'raw' (pentru documente)
      try {
        await cloudinary.uploader.destroy(cloudinaryId, { resource_type: 'raw' });
        return true;
      } catch (error2) {
        console.error('Delete error:', error2);
        return false;
      }
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