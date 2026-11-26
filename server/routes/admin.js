import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

// Platform overview statistics
router.get('/overview', (req, res) => {
  const users = db.getUsers();
  const donations = db.getDonations();
  const impact = db.getImpactStats();

  const restaurants = users.filter(u => u.role === 'restaurant');
  const ngos = users.filter(u => u.role === 'ngo');
  const volunteers = users.filter(u => u.role === 'volunteer');

  const pendingVerification = users.filter(u => !u.verified).length;
  const activeDonations = donations.filter(d => !['completed', 'cancelled'].includes(d.status));
  const completedDonations = donations.filter(d => d.status === 'completed');

  // AI Safety flags count
  const flaggedDonations = donations.filter(d => d.aiSafety?.requiresHumanReview || d.aiSafety?.status !== 'Low concern');

  res.json({
    metrics: {
      totalUsers: users.length,
      restaurantsCount: restaurants.length,
      ngosCount: ngos.length,
      volunteersCount: volunteers.length,
      totalDonations: donations.length,
      activeDonationsCount: activeDonations.length,
      completedDonationsCount: completedDonations.length,
      pendingVerificationCount: pendingVerification,
      flaggedCount: flaggedDonations.length
    },
    impact,
    flaggedDonations
  });
});

// List all users
router.get('/users', (req, res) => {
  const users = db.getUsers().map(({ password: _, ...u }) => u);
  res.json({ users });
});

// Toggle verification status
router.patch('/users/:id/verify', (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const updated = db.updateUser(user.id, { verified: !user.verified });
  const { password: _, ...userSafe } = updated;
  res.json({ message: `User ${userSafe.verified ? 'verified' : 'unverified'} successfully.`, user: userSafe });
});

// Suspend / activate account
router.patch('/users/:id/suspend', (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const isSuspended = !user.suspended;
  const updated = db.updateUser(user.id, { suspended: isSuspended });
  const { password: _, ...userSafe } = updated;
  res.json({ message: `Account ${isSuspended ? 'suspended' : 're-activated'}.`, user: userSafe });
});

export default router;
