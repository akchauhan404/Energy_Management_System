import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    created_at: new Date('2026-01-15').toISOString()
  });
});

router.put('/', authMiddleware, (req, res) => {
  const { name, email } = req.body;
  res.json({
    id: req.user.id,
    name: name || req.user.name,
    email: email || req.user.email,
    role: req.user.role,
    updated_at: new Date().toISOString()
  });
});

export default router;
