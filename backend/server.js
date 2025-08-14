const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const quizRoutes = require('./routes/quiz');
const userRoutes = require('./routes/users');
const liveRoutes = require('./routes/live');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// Configuration Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware de sécurité
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limite à 100 requêtes par IP par 15 minutes
});
app.use('/api/', limiter);

// CORS avec configuration complète pour résoudre les problèmes d'images
app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(null, true); // Temporairement permissif pour debug
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));

// Middleware spécial pour les fichiers statiques avec headers CORS complets
app.use('/uploads', (req, res, next) => {
  // Headers CORS pour les images
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

  // Cache control pour les images
  res.header('Cache-Control', 'public, max-age=31536000');

  next();
}, express.static('uploads', {
  setHeaders: (res, path) => {
    // Headers supplémentaires pour les fichiers statiques
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware global pour les headers CORS supplémentaires
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err.message);
    console.log('⚠️  Serveur démarré sans MongoDB - certaines fonctionnalités seront limitées');
  });

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', require('./routes/images')); // Route spéciale pour les images avec CORS

// Les fichiers statiques sont maintenant gérés plus haut avec CORS

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API Plateforme Éducation fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erreur serveur interne',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Socket.io pour les sessions live
io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Rejoindre une session live
  socket.on('join-live-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`Utilisateur ${socket.id} a rejoint la session ${sessionId}`);
  });

  // Messages chat en direct
  socket.on('live-chat-message', (data) => {
    io.to(`session-${data.sessionId}`).emit('new-chat-message', {
      message: data.message,
      userName: data.userName,
      timestamp: new Date()
    });
  });

  // Quitter une session
  socket.on('leave-live-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔗 Socket.io actif pour les sessions live`);
});

module.exports = app;
