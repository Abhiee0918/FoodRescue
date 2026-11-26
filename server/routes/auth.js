import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, organizationName, phone, address, vehicleType, serviceArea, capacity } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const validRoles = ['restaurant', 'ngo', 'volunteer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: `usr_${role}_${Date.now()}`,
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      organizationName: organizationName || name,
      phone: phone || '+1 (555) 000-0000',
      address: address || 'City Center',
      lat: 12.9141 + (Math.random() - 0.5) * 0.04,
      lng: 74.8560 + (Math.random() - 0.5) * 0.04,
      verified: role === 'volunteer' ? false : true,
      vehicleType: vehicleType || '',
      serviceArea: serviceArea || '',
      capacity: Number(capacity) || 100,
      createdAt: new Date().toISOString()
    };

    db.createUser(newUser);
    const token = generateToken(newUser);

    const { password: _, ...userSafe } = newUser;
    return res.status(201).json({
      message: 'Registration successful!',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);
    const { password: _, ...userSafe } = user;

    return res.json({
      message: 'Login successful!',
      token,
      user: userSafe
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Current user profile
router.get('/me', authenticateToken, (req, res) => {
  const { password: _, ...userSafe } = req.user;
  res.json({ user: userSafe });
});

// Quick demo login list
router.get('/demo-accounts', (req, res) => {
  res.json({
    accounts: [
      {
        role: 'restaurant',
        label: 'Restaurant / Caterer',
        email: 'restaurant@demo.com',
        password: 'demo123',
        description: 'Green Leaf Bistro & Catering (Downtown)'
      },
      {
        role: 'ngo',
        label: 'NGO / Charity',
        email: 'ngo@demo.com',
        password: 'demo123',
        description: 'Hope Community Kitchen (Riverside)'
      },
      {
        role: 'volunteer',
        label: 'Volunteer Courier',
        email: 'volunteer@demo.com',
        password: 'demo123',
        description: 'Alex Rivera (Eco Hatchback Driver)'
      },
      {
        role: 'admin',
        label: 'Operations Admin',
        email: 'admin@demo.com',
        password: 'demo123',
        description: 'FoodRescue Operations HQ'
      }
    ]
  });
});

export default router;
