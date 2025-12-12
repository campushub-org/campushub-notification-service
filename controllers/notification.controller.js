const { Notification, UserNotification } = require('../models');

// Fonction pour créer une notification globale et des entrées par utilisateur
exports.createNotification = async (notificationPayload) => {
    try {
        // Le payload contient les IDs des destinataires et les données de la notification
        const { recipientUserIds, ...notificationData } = notificationPayload;

        if (!recipientUserIds || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) {
            console.error('No recipients found in the payload, aborting notification creation.');
            return;
        }

        const { supportId, titre, statut, niveau, matiere, enseignantId } = notificationData;

        // Crée la notification principale
        const newNotification = await Notification.create({
            supportId,
            titre,
            statut,
            niveau,
            matiere,
            enseignantId
        });

        // Crée des entrées UserNotification pour chaque destinataire
        const userNotifications = recipientUserIds.map(userId => ({
            userId: userId,
            notificationId: newNotification.id,
            isRead: false
        }));

        await UserNotification.bulkCreate(userNotifications);
        console.log(`Notification ${newNotification.id} created for users: ${recipientUserIds.join(', ')}`);
        return newNotification;

    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Récupérer les notifications pour un utilisateur donné
exports.getNotificationsByUserId = async (req, res) => {
    try {
        // L'userId devrait idéalement venir d'un middleware d'authentification (req.user.id)
        // Pour l'instant, on le prend des paramètres pour les tests ou une implémentation simplifiée
        const userId = req.params.userId; 

        const userNotifications = await UserNotification.findAll({
            where: { userId: userId },
            include: [{
                model: Notification,
                as: 'notification', // Assurez-vous que c'est le même alias que dans l'association
                attributes: ['id', 'supportId', 'titre', 'statut', 'niveau', 'matiere', 'createdAt']
            }],
            order: [[{ model: Notification, as: 'notification' }, 'createdAt', 'DESC']]
        });

        const notifications = userNotifications.map(un => ({
            id: un.notification.id,
            userNotificationId: un.id, // ID de l'entrée UserNotification pour les actions
            titre: un.notification.titre,
            statut: un.notification.statut,
            niveau: un.notification.niveau,
            matiere: un.notification.matiere,
            isRead: un.isRead,
            createdAt: un.notification.createdAt
        }));

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications for user:', error);
        res.status(500).send('Error fetching notifications');
    }
};

// Marquer une notification comme lue pour un utilisateur spécifique
exports.markAsRead = async (req, res) => {
    try {
        // userNotificationId est l'ID de l'entrée dans la table UserNotification
        const userNotificationId = req.params.userNotificationId;  

        // TODO: SECURITY - This is insecure. It allows anyone to mark any notification as read.
        // The userId should be retrieved from a proper authentication middleware (e.g., req.user.id)
        // and used in the where clause.
        const userNotification = await UserNotification.findOne({
            where: { id: userNotificationId }
        });

        if (userNotification) {
            userNotification.isRead = true;
            await userNotification.save();
            res.status(200).json({ message: 'Notification marked as read', userNotification });
        } else {
            res.status(404).send('User Notification not found or not authorized');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).send('Error marking notification as read');
    }
};

// Supprimer une notification pour un utilisateur spécifique
exports.deleteNotification = async (req, res) => {
    try {
        const userNotificationId = req.params.userNotificationId; 

        // TODO: SECURITY - This is insecure. It allows anyone to delete any notification.
        // The userId should be retrieved from a proper authentication middleware (e.g., req.user.id)
        // and used in the where clause to ensure a user can only delete their own notifications.
        const deletedCount = await UserNotification.destroy({
            where: { id: userNotificationId }
        });

        if (deletedCount > 0) {
            res.status(204).send(); // No Content
        } else {
            res.status(404).send('User Notification not found or not authorized');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).send('Error deleting notification');
    }
};


