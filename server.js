const express = require('express');
const sequelize = require('./config/database');
const Notification = require('./models/notification.model');
const startEurekaClient = require('./config/eureka');
const { startConsumer } = require('./config/rabbitmq');
const notificationRoutes = require('./routes/notification.routes');

// Constants
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// App
const app = express();

// Middleware
app.use(express.json()); // For parsing application/json

// Basic routes
app.get('/', (req, res) => {
  res.send('Hello from campushub-notification-service (refactored)');
});

app.get('/health', (req, res) => {
    res.status(200).send('UP');
});

// API routes
app.use('/notifications', notificationRoutes);

const server = app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});

// Database sync and RabbitMQ consumer start
sequelize.sync().then(() => {
    console.log('Database synced.');
    // Start RabbitMQ consumer
    startConsumer();
}).catch(err => {
    console.error('Failed to sync database:', err);
});

// Start Eureka client
startEurekaClient(server);