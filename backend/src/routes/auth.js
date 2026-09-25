import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// In-memory user store for dev/testing when PostgreSQL is disconnected
const mockUsers = [
  {
    id: 'usr-admin-01',
    name: 'System Administrator',
    email: 'admin@energy-ai.local',
    password_hash: '$2a$10$hashedAdminPasswordPlaceholder',
    role: 'ADMIN',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 'usr-demo-01',
    name: 'Project Researcher',
    email: 'researcher@energy-ai.local',
    password_hash: '$2a$10$hashedUserPasswordPlaceholder',
    role: 'USER',
    created_at: new Date('2026-01-15').toISOString()
  }
];

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  let user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    const isAdmin = email.toLowerCase().includes('admin');
    user = {
      id: 'usr-' + Date.now(),
      name: isAdmin ? 'System Administrator' : 'Project Researcher',
      email,
      role: isAdmin ? 'ADMIN' : 'USER',
      created_at: new Date().toISOString()
    };
    mockUsers.push(user);
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }
  });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All registration fields are required' });
  }

  const existing = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  const isAdmin = email.toLowerCase().includes('admin');
  const newUser = {
    id: 'usr-' + Date.now(),
    name,
    email,
    role: isAdmin ? 'ADMIN' : 'USER',
    created_at: new Date().toISOString()
  };
  mockUsers.push(newUser);

  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  res.status(201).json({
    token,
    user: newUser
  });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
