import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const notifs = db.getNotifications(req.user.id);
  // Also include notifications targeted to their role
  const roleNotifs = db.getNotifications().filter(n => n.role === req.user.role && !n.userId);
  const combined = [...notifs, ...roleNotifs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ notifications: combined });
});

router.patch('/:id/read', authenticateToken, (req, res) => {
  const notif = db.markNotificationRead(req.params.id);
  res.json({ notification: notif });
});

export default router;
