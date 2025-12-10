const Notification = require('../models/notification.model');

exports.getNotificationsByTeacherId = async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        const notifications = await Notification.findAll({
            where: { enseignantId: teacherId },
            order: [['createdAt', 'DESC']]
        });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Error fetching notifications');
    }
};

// Potentially add other controller functions here (e.g., mark as read, delete, etc.)

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (notification) {
            notification.isRead = true;
            await notification.save();
            res.status(200).json(notification);
        } else {
            res.status(404).send('Notification not found');
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).send('Error marking notification as read');
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (notification) {
            await notification.destroy();
            res.status(204).send();
        } else {
            res.status(404).send('Notification not found');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).send('Error deleting notification');
    }
};

