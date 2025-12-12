const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

// Récupérer les notifications pour un utilisateur spécifique
// L'userId devrait venir d'un middleware d'authentification en production
router.get('/user/:userId', notificationController.getNotificationsByUserId);

// Marquer une notification comme lue pour un utilisateur
// L'ID ici est l'ID de UserNotification
router.put('/mark-as-read/:userNotificationId', notificationController.markAsRead);

// Supprimer une notification pour un utilisateur
// L'ID ici est l'ID de UserNotification
router.delete('/:userNotificationId', notificationController.deleteNotification);

module.exports = router;
