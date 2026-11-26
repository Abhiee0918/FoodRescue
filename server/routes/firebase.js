import express from 'express';
import { firebaseService } from '../services/firebaseService.js';
import { db } from '../db.js';

const router = express.Router();

// Get Firebase backend status
router.get('/status', async (req, res) => {
  const usersCount = db.getUsers().length;
  const donationsCount = db.getDonations().length;

  res.json({
    status: {
      ...firebaseService.status,
      projectId: firebaseService.config.projectId,
      emulatorHost: firebaseService.config.emulatorHost || 'None (Direct Cloud API)',
      authDomain: firebaseService.config.authDomain,
      hasApiKey: Boolean(firebaseService.config.apiKey),
      collections: {
        users: usersCount,
        donations: donationsCount,
        notifications: db.getNotifications().length
      }
    }
  });
});

// Update Firebase configuration at runtime
router.post('/config', (req, res) => {
  const { projectId, apiKey, authDomain, emulatorHost } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required.' });
  }

  firebaseService.saveConfig({
    projectId,
    apiKey: apiKey || '',
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    emulatorHost: emulatorHost || ''
  });

  res.json({
    message: 'Firebase configuration updated successfully!',
    config: {
      projectId: firebaseService.config.projectId,
      authDomain: firebaseService.config.authDomain,
      hasApiKey: Boolean(firebaseService.config.apiKey)
    }
  });
});

// Test live connection to Firestore
router.post('/test', async (req, res) => {
  const result = await firebaseService.testConnection();
  res.json(result);
});

// Seed/Sync current database into Firestore
router.post('/sync', async (req, res) => {
  try {
    const results = await firebaseService.seedAll(db);
    res.json({
      message: 'Firebase Firestore synchronized successfully!',
      records: results,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Firebase sync error:', err);
    res.status(500).json({ error: 'Failed to synchronize with Firestore: ' + err.message });
  }
});

export default router;
