const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// Define routes
router.get('/teacher/:teacherId', notificationController.getNotificationsByTeacherId);

// Mark a notification as read
router.put('/:id/read', notificationController.markAsRead);

// Delete a notification
router.delete('/:id', notificationController.deleteNotification);


module.exports = router;
