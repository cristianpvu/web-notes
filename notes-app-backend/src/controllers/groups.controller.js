const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { validateGroupPermission, validateGroupRole } = require('../utils/validators');

class GroupsController {
  static async getAllGroups(req, res, next) {
    try {
      const [createdGroups, memberGroups] = await Promise.all([
        prisma.studyGroup.findMany({
          where: { createdBy: req.user.userId },
          include: {
            _count: {
              select: { members: true, notes: true }
            },
            members: {
              take: 5,
              include: {
                user: {
                  select: { id: true, email: true, name: true }
                }
              }
            }
          }
        }),
        prisma.groupMember.findMany({
          where: { userId: req.user.userId },
          include: {
            group: {
              include: {
                _count: {
                  select: { members: true, notes: true }
                },
                creator: {
                  select: { id: true, email: true, name: true }
                }
              }
            }
          }
        })
      ]);

      res.json({
        created: createdGroups,
        member: memberGroups.map(m => ({
          ...m.group,
          myRole: m.role,
          myPermission: m.permission
        }))
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGroupById(req, res, next) {
    try {
      const { id } = req.params;

      const group = await prisma.studyGroup.findUnique({
        where: { id },
        include: {
          creator: {
            select: { id: true, email: true, name: true }
          },
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            },
            orderBy: { joinedAt: 'asc' }
          },
          notes: {
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
            },
            orderBy: { addedAt: 'desc' }
          }
        }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const isMember = group.members.some(m => m.userId === req.user.userId);
      const isCreator = group.createdBy === req.user.userId;

      if (!isMember && !isCreator && group.isPrivate) {
        return res.status(403).json({ error: 'You do not have access to this private group' });
      }

      const { password, ...groupData } = group;

      res.json({
        ...groupData,
        isCreator,
        isMember,
        myMembership: group.members.find(m => m.userId === req.user.userId)
      });
    } catch (error) {
      next(error);
    }
  }

  static async createGroup(req, res, next) {
    try {
      const { name, description, isPrivate, password } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Group name is required' });
      }

      let hashedPassword = null;
      if (isPrivate && password) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const group = await prisma.studyGroup.create({
        data: {
          name,
          description,
          isPrivate: isPrivate || false,
          password: hashedPassword,
          createdBy: req.user.userId,
          members: {
            create: {
              userId: req.user.userId,
              role: 'admin',
              permission: 'edit'
            }
          }
        },
        include: {
          creator: {
            select: { id: true, email: true, name: true }
          },
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          }
        }
      });

      const { password: _, ...groupData } = group;

      res.status(201).json(groupData);
    } catch (error) {
      next(error);
    }
  }

  static async updateGroup(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, isPrivate, password } = req.body;

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (group.createdBy !== req.user.userId) {
        return res.status(403).json({ error: 'Only the creator can modify the group' });
      }

      let updateData = { name, description, isPrivate };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      } else if (isPrivate === false) {
        updateData.password = null;
      }

      const updated = await prisma.studyGroup.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: { members: true, notes: true }
          }
        }
      });

      const { password: _, ...groupData } = updated;

      res.json(groupData);
    } catch (error) {
      next(error);
    }
  }

  static async deleteGroup(req, res, next) {
    try {
      const { id } = req.params;

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (group.createdBy !== req.user.userId) {
        return res.status(403).json({ error: 'Only the creator can delete the group' });
      }

      await prisma.studyGroup.delete({ where: { id } });

      res.json({ message: 'Group deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async checkGroupPrivacy(req, res, next) {
    try {
      const { id } = req.params;

      const group = await prisma.studyGroup.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          isPrivate: true
        }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      res.json({
        id: group.id,
        name: group.name,
        isPrivate: group.isPrivate
      });
    } catch (error) {
      next(error);
    }
  }

  static async joinGroup(req, res, next) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const group = await prisma.studyGroup.findUnique({
        where: { id },
        include: {
          members: {
            where: { userId: req.user.userId }
          }
        }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (group.members.length > 0) {
        return res.status(400).json({ error: 'You are already a member of this group' });
      }

      if (group.isPrivate) {
        if (!password) {
          return res.status(400).json({ error: 'Password is required for this group' });
        }

        const isPasswordValid = await bcrypt.compare(password, group.password);
        if (!isPasswordValid) {
          return res.status(403).json({ error: 'Incorrect password' });
        }
      }

      const member = await prisma.groupMember.create({
        data: {
          groupId: id,
          userId: req.user.userId,
          role: 'member',
          permission: 'read'
        },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  static async leaveGroup(req, res, next) {
    try {
      const { id } = req.params;

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (group.createdBy === req.user.userId) {
        return res.status(400).json({ 
          error: 'Creator cannot leave the group. Delete the group instead.' 
        });
      }

      const member = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId: req.user.userId
        }
      });

      if (!member) {
        return res.status(404).json({ error: 'You are not a member of this group' });
      }

      await prisma.groupMember.delete({ where: { id: member.id } });

      res.json({ message: 'You have left the group successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req, res, next) {
    try {
      const { id } = req.params;
      const { email, permission = 'read', role = 'member' } = req.body;

      const myMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId: req.user.userId
        }
      });

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const isCreator = group.createdBy === req.user.userId;
      const isAdmin = myMembership?.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({ 
          error: 'Only administrators can invite members' 
        });
      }

      const targetUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User does not exist' });
      }

      if (!targetUser.email.endsWith('@stud.ase.ro')) {
        return res.status(403).json({ 
          error: 'You can only invite ASE students' 
        });
      }

      const existingMember = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId: targetUser.id
        }
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member' });
      }

      validateGroupPermission(permission);
      validateGroupRole(role);

      const member = await prisma.groupMember.create({
        data: {
          groupId: id,
          userId: targetUser.id,
          permission,
          role
        },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req, res, next) {
    try {
      const { id, memberId } = req.params;

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const myMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId: req.user.userId
        }
      });

      const isCreator = group.createdBy === req.user.userId;
      const isAdmin = myMembership?.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({ 
          error: 'Only administrators can remove members' 
        });
      }

      const member = await prisma.groupMember.findUnique({
        where: { id: memberId }
      });

      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (member.userId === group.createdBy) {
        return res.status(400).json({ error: 'You cannot remove the group creator' });
      }

      await prisma.groupMember.delete({ where: { id: memberId } });

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async updateMemberPermissions(req, res, next) {
    try {
      const { id, memberId } = req.params;
      const { permission, role } = req.body;

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const myMembership = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId: req.user.userId
        }
      });

      const isCreator = group.createdBy === req.user.userId;
      const isAdmin = myMembership?.role === 'admin';

      if (!isCreator && !isAdmin) {
        return res.status(403).json({ 
          error: 'Only administrators can modify permissions' 
        });
      }

      const member = await prisma.groupMember.findUnique({
        where: { id: memberId }
      });

      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      if (member.userId === group.createdBy) {
        return res.status(400).json({ 
          error: 'You cannot modify the creator\'s permissions' 
        });
      }

      let updateData = {};
      if (permission) {
        validateGroupPermission(permission);
        updateData.permission = permission;
      }
      if (role) {
        validateGroupRole(role);
        updateData.role = role;
      }

      const updated = await prisma.groupMember.update({
        where: { id: memberId },
        data: updateData,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }

  static async addNoteToGroup(req, res, next) {
    try {
      const { id } = req.params;
      const { noteId } = req.body;

      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId: req.user.userId
        }
      });

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const isCreator = group.createdBy === req.user.userId;

      if (!membership && !isCreator) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }

      if (membership && membership.permission !== 'edit' && !isCreator) {
        return res.status(403).json({ 
          error: 'You do not have edit permissions in this group' 
        });
      }

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
        return res.status(404).json({ 
          error: 'Note not found or you do not have access to it' 
        });
      }

      const existing = await prisma.groupNote.findFirst({
        where: {
          groupId: id,
          noteId
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Note is already in the group' });
      }

      const groupNote = await prisma.groupNote.create({
        data: {
          groupId: id,
          noteId,
          addedBy: req.user.userId
        },
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

      res.status(201).json(groupNote);
    } catch (error) {
      next(error);
    }
  }

  static async removeNoteFromGroup(req, res, next) {
    try {
      const { id, noteId } = req.params;

      const membership = await prisma.groupMember.findFirst({
        where: {
          groupId: id,
          userId: req.user.userId
        }
      });

      const group = await prisma.studyGroup.findUnique({
        where: { id }
      });

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      const isCreator = group.createdBy === req.user.userId;
      const hasEditPermission = membership?.permission === 'edit';

      if (!isCreator && !hasEditPermission) {
        return res.status(403).json({ 
          error: 'You do not have permissions to remove notes from this group' 
        });
      }

      const groupNote = await prisma.groupNote.findFirst({
        where: {
          groupId: id,
          noteId
        }
      });

      if (!groupNote) {
        return res.status(404).json({ error: 'Note is not in this group' });
      }

      await prisma.groupNote.delete({ where: { id: groupNote.id } });

      res.json({ message: 'Note removed from group successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = GroupsController;