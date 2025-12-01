const prisma = require('../config/database');

class TagsController {
  static async getAllTags(req, res, next) {
    try {
      const tags = await prisma.tag.findMany({
        where: { userId: req.user.userId },
        include: {
          _count: {
            select: { noteTags: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(tags);
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req, res, next) {
    try {
      const { name, color } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Numele tag-ului este obligatoriu' });
      }

      const tag = await prisma.tag.create({
        data: {
          name,
          color: color || '#10B981',
          userId: req.user.userId
        }
      });

      res.status(201).json(tag);
    } catch (error) {
      next(error);
    }
  }

  static async updateTag(req, res, next) {
    try {
      const { id } = req.params;
      const { name, color } = req.body;

      const tag = await prisma.tag.findFirst({
        where: { id, userId: req.user.userId }
      });

      if (!tag) {
        return res.status(404).json({ error: 'Tag-ul nu a fost găsit' });
      }

      const updated = await prisma.tag.update({
        where: { id },
        data: { name, color }
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req, res, next) {
    try {
      const { id } = req.params;

      const tag = await prisma.tag.findFirst({
        where: { id, userId: req.user.userId }
      });

      if (!tag) {
        return res.status(404).json({ error: 'Tag-ul nu a fost găsit' });
      }

      await prisma.tag.delete({ where: { id } });

      res.json({ message: 'Tag șters cu succes' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TagsController;