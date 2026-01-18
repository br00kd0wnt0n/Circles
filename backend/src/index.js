import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

import env from './config/env.js';
import { testConnection } from './config/database.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth.js';
import householdsRoutes from './routes/households.js';
import circlesRoutes from './routes/circles.js';
import contactsRoutes from './routes/contacts.js';
import invitesRoutes from './routes/invites.js';
import offersRoutes from './routes/offers.js';
import eventsRoutes from './routes/events.js';
import statusRoutes from './routes/status.js';
import adminAuthRoutes from './routes/admin/auth.js';
import adminBusinessesRoutes from './routes/admin/businesses.js';
import adminOffersRoutes from './routes/admin/offers.js';
import adminEventsRoutes from './routes/admin/events.js';

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.io setup - allow multiple origins for development
const socketAllowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: socketAllowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to routes
app.set('io', io);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS - allow multiple origins for development
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/households', householdsRoutes);
app.use('/api/circles', circlesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/invites', invitesRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/businesses', adminBusinessesRoutes);
app.use('/api/admin/offers', adminOffersRoutes);
app.use('/api/admin/events', adminEventsRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join household room
  socket.on('join:household', (householdId) => {
    socket.join(`household:${householdId}`);
    console.log(`Socket ${socket.id} joined household:${householdId}`);
  });

  // Leave household room
  socket.on('leave:household', (householdId) => {
    socket.leave(`household:${householdId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
async function start() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Start HTTP server
  httpServer.listen(env.PORT, () => {
    console.log(`
🚀 Circles API Server
━━━━━━━━━━━━━━━━━━━━━
Environment: ${env.NODE_ENV}
Port: ${env.PORT}
Frontend: ${env.FRONTEND_URL}
━━━━━━━━━━━━━━━━━━━━━
    `);
  });
}

start();

export { app, io };
