const prisma = require('../config/database');
const MarkdownService = require('../services/markdown.service');
const { validateNoteData } = require('../utils/validators');

class NotesController {
  static async getAllNotes(req, res, next) {
    try {
      const { 
        subjectId, 
        tagId, 
        keyword, 
        startDate, 
        endDate,
        search,
        sortBy = 'updatedAt',
        order = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      const skip = (page - 1) * limit;
      const where = { userId: req.user.userId };

      if (subjectId) where.subjectId = subjectId;
      if (keyword) where.keywords = { has: keyword };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (startDate || endDate) {
        where.courseDate = {};
        if (startDate) where.courseDate.gte = new Date(startDate);
        if (endDate) where.courseDate.lte = new Date(endDate);
      }
      if (tagId) {
        where.tags = {
          some: { tagId: tagId }
        };
      }

      const [notes, total] = await Promise.all([
        prisma.note.findMany({
          where,
          include: {
            subject: true,
            tags: {
              include: { tag: true }
            },
            attachments: true,
            groupNotes: {
              include: { group: true }
            },
            _count: {
              select: { sharedWith: true }
            }
          },
          orderBy: { [sortBy]: order },
          skip: parseInt(skip),
          take: parseInt(limit),
        }),
        prisma.note.count({ where })
      ]);

      res.json({
        notes,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNoteById(req, res, next) {
    try {
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: {
          id,
          OR: [
            { userId: req.user.userId },
            { sharedWith: { some: { sharedWith: req.user.userId } } },
            {
              groupNotes: {
                some: {
                  group: {
                    OR: [
                      { createdBy: req.user.userId },
                      { members: { some: { userId: req.user.userId } } }
                    ]
                  }
                }
              }
            }
          ]
        },
        include: {
          subject: true,
          tags: { include: { tag: true } },
          attachments: true,
          sharedWith: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          },
          user: {
            select: { id: true, email: true, name: true }
          },
          groupNotes: {
            include: { group: true }
          }
        }
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      await prisma.noteActivity.create({
        data: {
          noteId: id,
          userId: req.user.userId,
          action: 'viewed',
        }
      });

      res.json(note);
    } catch (error) {
      next(error);
    }
  }

  static async createNote(req, res, next) {
    try {
      const { 
        title, 
        content, 
        subjectId, 
        tagIds = [], 
        courseDate,
        sourceType,
        sourceUrl,
        isPublic = false,
        groupId,
        keywords = []  // Get keywords from request body
      } = req.body;

      validateNoteData({ title, content });

      const sanitizedContent = MarkdownService.sanitize(content);
      const htmlContent = MarkdownService.toHTML(sanitizedContent);
      
      // Use keywords from request body instead of auto-extracting
      // Only extract if no keywords were provided
      const finalKeywords = keywords && keywords.length > 0 
        ? keywords 
        : MarkdownService.extractKeywords(content);

      const note = await prisma.note.create({
        data: {
          title,
          content: htmlContent,
          rawContent: sanitizedContent,
          userId: req.user.userId,
          subjectId: subjectId || null,
          courseDate: courseDate ? new Date(courseDate) : null,
          sourceType,
          sourceUrl,
          isPublic,
          keywords: finalKeywords,
          tags: {
            create: tagIds.map(tagId => ({
              tag: { connect: { id: tagId } }
            }))
          }
        },
        include: {
          subject: true,
          tags: { include: { tag: true } },
          attachments: true,
          groupNotes: {
            include: { group: true }
          }
        }
      });

      // If groupId is provided, link the note to the group
      if (groupId) {
        await prisma.groupNote.create({
          data: {
            groupId: groupId,
            noteId: note.id,
            addedBy: req.user.userId
          }
        });
        
        // Reload note with group info
        const noteWithGroup = await prisma.note.findUnique({
          where: { id: note.id },
          include: {
            subject: true,
            tags: { include: { tag: true } },
            attachments: true,
            groupNotes: {
              include: { group: true }
            }
          }
        });
        
        await prisma.noteActivity.create({
          data: {
            noteId: note.id,
            userId: req.user.userId,
            action: 'created',
          }
        });

        return res.status(201).json(noteWithGroup);
      }

      await prisma.noteActivity.create({
        data: {
          noteId: note.id,
          userId: req.user.userId,
          action: 'created',
        }
      });

      res.status(201).json(note);
    } catch (error) {
      next(error);
    }
  }

  static async updateNote(req, res, next) {
    try {
      const { id } = req.params;
      const { 
        title, 
        content, 
        subjectId, 
        tagIds, 
        courseDate,
        sourceType,
        sourceUrl,
        isPublic,
        keywords  // Get keywords from request body if provided
      } = req.body;

      const existingNote = await prisma.note.findFirst({
        where: {
          id,
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

      if (!existingNote) {
        return res.status(404).json({ error: 'Note not found or you do not have permissions' });
      }

      let updateData = { title, subjectId, courseDate, sourceType, sourceUrl, isPublic };
      
      if (content) {
        const sanitizedContent = MarkdownService.sanitize(content);
        updateData.content = MarkdownService.toHTML(sanitizedContent);
        updateData.rawContent = sanitizedContent;
        
        // Only update keywords if explicitly provided in the request
        // Otherwise, keep existing keywords unchanged
        if (keywords !== undefined) {
          updateData.keywords = keywords && keywords.length > 0 
            ? keywords 
            : MarkdownService.extractKeywords(content);
        }
      }

      if (tagIds) {
        await prisma.noteTag.deleteMany({ where: { noteId: id } });
      }

      const note = await prisma.note.update({
        where: { id },
        data: {
          ...updateData,
          ...(tagIds && {
            tags: {
              create: tagIds.map(tagId => ({
                tag: { connect: { id: tagId } }
              }))
            }
          })
        },
        include: {
          subject: true,
          tags: { include: { tag: true } },
          attachments: true,
          groupNotes: {
            include: { group: true }
          }
        }
      });

      await prisma.noteActivity.create({
        data: {
          noteId: id,
          userId: req.user.userId,
          action: 'edited',
        }
      });

      res.json(note);
    } catch (error) {
      next(error);
    }
  }

  static async deleteNote(req, res, next) {
    try {
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: {
          id,
          userId: req.user.userId
        }
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      await prisma.note.delete({ where: { id } });

      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async shareNote(req, res, next) {
    try {
      const { id } = req.params;
      const { email, permission = 'read' } = req.body;

      const note = await prisma.note.findFirst({
        where: { id, userId: req.user.userId }
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      const targetUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User does not exist' });
      }

      if (!targetUser.email.endsWith('@stud.ase.ro')) {
        return res.status(403).json({ error: 'You can only share with ASE students' });
      }

      const share = await prisma.sharedNote.create({
        data: {
          noteId: id,
          sharedWith: targetUser.id,
          permission
        },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      await prisma.noteActivity.create({
        data: {
          noteId: id,
          userId: req.user.userId,
          action: 'shared',
          details: `Shared with ${email}`
        }
      });

      res.json(share);
    } catch (error) {
      next(error);
    }
  }

  static async unshareNote(req, res, next) {
    try {
      const { id, shareId } = req.params;

      const note = await prisma.note.findFirst({
        where: { id, userId: req.user.userId }
      });

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      await prisma.sharedNote.delete({ where: { id: shareId } });

      res.json({ message: 'Sharing revoked' });
    } catch (error) {
      next(error);
    }
  }

  static async getSharedNotes(req, res, next) {
    try {
      const sharedNotes = await prisma.sharedNote.findMany({
        where: { sharedWith: req.user.userId },
        include: {
          note: {
            include: {
              subject: true,
              tags: { include: { tag: true } },
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          }
        }
      });

      res.json(sharedNotes);
    } catch (error) {
      next(error);
    }
  }

  static async getPublicNote(req, res, next) {
    try {
      const { id } = req.params;

      const note = await prisma.note.findFirst({
        where: {
          id,
          isPublic: true
        },
        include: {
          subject: true,
          tags: { include: { tag: true } },
          user: {
            select: { email: true, name: true }
          }
        }
      });

      if (!note) {
        return res.status(404).json({ 
          error: 'Note not found or is not public' 
        });
      }

      res.json(note);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotesController;