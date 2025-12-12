module.exports = (sequelize, DataTypes) => {
    const UserNotification = sequelize.define('UserNotification', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: { // L'ID de l'utilisateur recevant la notification (peut être enseignant, doyen, étudiant, etc.)
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        notificationId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }
    }, {
        tableName: 'user_notifications',
        timestamps: true // Ajoute createdAt et updatedAt
    });

    return UserNotification;
};
