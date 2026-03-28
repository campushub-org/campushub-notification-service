const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./models');
const startEurekaClient = require('./config/eureka');
const { startConsumer } = require('./config/rabbitmq');
const notificationRoutes = require('./routes/notification.routes');

// Constants
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'c3b3f4d4a5e5b6c6d7e7f8a8b9c9d0e0f1a1b2c2d3e3f4a4b5c5d6e6f7a7b8c8';

// App Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// Socket.io Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
  
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(cleanToken, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = decoded; // Contains id, username, role
    next();
  });
});

// Socket.io Connection Handling
io.on('connection', (socket) => {
  const userId = socket.user.id;
  console.log(`User connected to WebSocket: ${socket.user.username} (ID: ${userId})`);
  
  // Join a room specific to this user for private notifications
  socket.join(`user_${userId}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.send('CampusHub Notification Service with Real-time Support');
});

app.get('/health', (req, res) => {
    res.status(200).send('UP');
});

// API routes
app.use('/api/notifications', notificationRoutes);

// Export io for use in other modules (like rabbitmq)
global.io = io;

// Server start
server.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
  
  // Database sync and RabbitMQ consumer start
  db.sequelize.sync().then(() => {
      console.log('Database synced.');
      // Start RabbitMQ consumer
      startConsumer();
  }).catch(err => {
      console.error('Failed to sync database:', err);
  });

  // Start Eureka client
  startEurekaClient(server);
});
