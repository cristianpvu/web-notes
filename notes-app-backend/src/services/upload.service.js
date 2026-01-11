const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const path = require('path');

class UploadService {
  static async uploadFile(file, folder = 'notes-attachments') {
    try {
      let resourceType = 'auto';
      let uploadOptions = {
        use_filename: true,
        unique_filename: true,
      };

      if (file.mimetype.startsWith('image/')) {
        resourceType = 'image';
        uploadOptions.folder = folder;
      } else if (file.mimetype.startsWith('video/')) {
        resourceType = 'video';
        uploadOptions.folder = folder;
      } else if (file.mimetype === 'application/pdf') {
        resourceType = 'image';
        uploadOptions.folder = folder;
        uploadOptions.flags = 'attachment';
      } else {
        resourceType = 'raw';
        const extension = path.extname(file.name);
        const basename = path.basename(file.name, extension).replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        uploadOptions.public_id = `${folder}/${basename}_${timestamp}_${random}${extension}`;
        uploadOptions.use_filename = false;
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
      throw new Error('Error uploading file');
    }
  }

  static async deleteFile(cloudinaryId, resourceType = 'image') {
    try {
      await cloudinary.uploader.destroy(cloudinaryId, { resource_type: resourceType });
      return true;
    } catch (error) {
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
      throw new Error('No file uploaded');
    }

    if (file.size > maxSize) {
      throw new Error(`File too big. Maximum: ${maxSize / (1024 * 1024)}MB`);
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
      throw new Error('Unsupported file type');
    }

    return true;
  }
}

module.exports = UploadService;