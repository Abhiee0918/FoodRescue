import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import { createDonationsRouter } from './routes/donations.js';
import aiRouter from './routes/ai.js';
import { createTrackingRouter } from './routes/tracking.js';
import impactRouter from './routes/impact.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter from './routes/admin.js';
import firebaseRouter from './routes/firebase.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with broad local dev CORS support
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('join:room', (room) => {
    socket.join(room);
    console.log(`[Socket.IO] Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/donations', createDonationsRouter(io));
app.use('/api/ai', aiRouter);
app.use('/api/tracking', createTrackingRouter(io));
app.use('/api/impact', impactRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/firebase', firebaseRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'FoodRescue AI',
    timestamp: new Date().toISOString(),
    version: '1.0.0-production'
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDist)) {
  console.log(`📦 Serving compiled client from ${clientDist}`);
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================================`);
  console.log(`🌿 FoodRescue Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://127.0.0.1:${PORT}`);
  console.log(`📡 Real-time Socket.IO connected & ready`);
  console.log(`⚡ Core Engine active (HACCP Safety + Smart Matching + Vision)`);
  console.log(`=================================================`);
});
