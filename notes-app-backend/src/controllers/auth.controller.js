const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../config/database');
const { validateEmail } = require('../utils/validators');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class AuthController {
  static async login(req, res, next) {
    try {
      const { email } = req.body;

      if (!email || !validateEmail(email)) {
        return res.status(400).json({ 
          error: 'Invalid email. Only @stud.ase.ro addresses are allowed' 
        });
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: process.env.FRONTEND_URL || 'http://localhost:3000',
        }
      });

      if (error) throw error;

      res.json({ 
        message: 'Authentication link sent to email',
        email: email 
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyToken(req, res, next) {
    try {
      const { token, access_token } = req.body;
      
      let user;
      let error;

      if (access_token) {
        const result = await supabase.auth.getUser(access_token);
        user = result.data.user;
        error = result.error;
      } 
      else if (token) {
        const result = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });
        user = result.data.user;
        error = result.error;
      } else {
        return res.status(400).json({ error: 'Token missing' });
      }

      if (error) throw error;

      if (!validateEmail(user.email)) {
        return res.status(403).json({ 
          error: 'Only ASE students can access the application' 
        });
      }

      let dbUser = await prisma.user.findUnique({
        where: { email: user.email }
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0],
          }
        });
      }

      const jwtToken = jwt.sign(
        { 
          userId: dbUser.id, 
          email: dbUser.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token: jwtToken,
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              notes: true,
              subjects: true,
              tags: true,
              groupMemberships: true,
            }
          }
        }
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name } = req.body;

      const user = await prisma.user.update({
        where: { id: req.user.userId },
        data: { name },
        select: {
          id: true,
          email: true,
          name: true,
        }
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;