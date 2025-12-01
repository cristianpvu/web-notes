const prisma = require('../config/database');

class SubjectsController {
  static async getAllSubjects(req, res, next) {
    try {
      const subjects = await prisma.subject.findMany({
        where: { userId: req.user.userId },
        include: {
          _count: {
            select: { notes: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      res.json(subjects);
    } catch (error) {
      next(error);
    }
  }

  static async getSubjectById(req, res, next) {
    try {
      const { id } = req.params;

      const subject = await prisma.subject.findFirst({
        where: {
          id,
          userId: req.user.userId
        },
        include: {
          notes: {
            orderBy: { updatedAt: 'desc' },
            take: 10,
            include: {
              tags: { include: { tag: true } }
            }
          },
          _count: {
            select: { notes: true }
          }
        }
      });

      if (!subject) {
        return res.status(404).json({ error: 'Materia nu a fost găsită' });
      }

      res.json(subject);
    } catch (error) {
      next(error);
    }
  }

  static async createSubject(req, res, next) {
    try {
      const { name, code, color, description } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Numele materiei este obligatoriu' });
      }

      const subject = await prisma.subject.create({
        data: {
          name,
          code,
          color: color || '#3B82F6',
          description,
          userId: req.user.userId
        }
      });

      res.status(201).json(subject);
    } catch (error) {
      next(error);
    }
  }

  static async updateSubject(req, res, next) {
    try {
      const { id } = req.params;
      const { name, code, color, description } = req.body;

      const subject = await prisma.subject.findFirst({
        where: { id, userId: req.user.userId }
      });

      if (!subject) {
        return res.status(404).json({ error: 'Materia nu a fost găsită' });
      }

      const updated = await prisma.subject.update({
        where: { id },
        data: { name, code, color, description }
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubject(req, res, next) {
    try {
      const { id } = req.params;

      const subject = await prisma.subject.findFirst({
        where: { id, userId: req.user.userId }
      });

      if (!subject) {
        return res.status(404).json({ error: 'Materia nu a fost găsită' });
      }

      await prisma.subject.delete({ where: { id } });

      res.json({ message: 'Materie ștearsă cu succes' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SubjectsController;