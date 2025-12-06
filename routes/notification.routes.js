const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// Define routes
router.get('/teacher/:teacherId', notificationController.getNotificationsByTeacherId);

// Potentially add other notification-related routes here

module.exports = router;
