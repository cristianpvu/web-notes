const prisma = require('../config/database');
const UploadService = require('../services/upload.service');

class AttachmentsController {
  static async uploadAttachment(req, res, next) {
    try {
      const { noteId } = req.params;

      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { userId: req.user.userId },
            { 
              sharedWith: { 
                some: { 
                  sharedWith: req.user.userId,
                  permission: 'edit'
                } 
              } 
            }
          ]
        }
      });

      if (!note) {
        return res.status(404).json({ error: 'Notița nu a fost găsită sau nu ai permisiuni' });
      }

      if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'Niciun fișier încărcat' });
      }

      const file = req.files.file;

      UploadService.validateFile(file);

      const uploadResult = await UploadService.uploadFile(file, `notes/${noteId}`);

      const attachment = await prisma.attachment.create({
        data: {
          noteId,
          fileName: file.name,
          fileUrl: uploadResult.url,
          fileType: UploadService.getFileType(file.mimetype),
          fileSize: file.size,
          cloudinaryId: uploadResult.cloudinaryId,
        }
      });

      res.status(201).json(attachment);
    } catch (error) {
      next(error);
    }
  }

  static async getNoteAttachments(req, res, next) {
    try {
      const { noteId } = req.params;

      const note = await prisma.note.findFirst({
        where: {
          id: noteId,
          OR: [
            { userId: req.user.userId },
            { sharedWith: { some: { sharedWith: req.user.userId } } }
          ]
        }
      });

      if (!note) {
        return res.status(404).json({ error: 'Notița nu a fost găsită' });
      }

      const attachments = await prisma.attachment.findMany({
        where: { noteId },
        orderBy: { createdAt: 'desc' }
      });

      res.json(attachments);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(req, res, next) {
    try {
      const { id } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
          note: true
        }
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Atașamentul nu a fost găsit' });
      }

      if (attachment.note.userId !== req.user.userId) {
        const hasEditPermission = await prisma.sharedNote.findFirst({
          where: {
            noteId: attachment.noteId,
            sharedWith: req.user.userId,
            permission: 'edit'
          }
        });

        if (!hasEditPermission) {
          return res.status(403).json({ error: 'Nu ai permisiuni să ștergi acest atașament' });
        }
      }

      if (attachment.cloudinaryId) {
        await UploadService.deleteFile(attachment.cloudinaryId);
      }

      await prisma.attachment.delete({ where: { id } });

      res.json({ message: 'Atașament șters cu succes' });
    } catch (error) {
      next(error);
    }
  }

  static async getAttachmentById(req, res, next) {
    try {
      const { id } = req.params;

      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
          note: {
            select: {
              id: true,
              title: true,
              userId: true
            }
          }
        }
      });

      if (!attachment) {
        return res.status(404).json({ error: 'Atașamentul nu a fost găsit' });
      }

      const hasAccess = await prisma.note.findFirst({
        where: {
          id: attachment.noteId,
          OR: [
            { userId: req.user.userId },
            { sharedWith: { some: { sharedWith: req.user.userId } } }
          ]
        }
      });

      if (!hasAccess) {
        return res.status(403).json({ error: 'Nu ai acces la acest atașament' });
      }

      res.json(attachment);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AttachmentsController;