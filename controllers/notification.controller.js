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
