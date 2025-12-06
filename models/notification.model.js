const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    supportId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    enseignantId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    statut: {
        type: DataTypes.STRING,
        allowNull: false
    },
    niveau: {
        type: DataTypes.STRING,
        allowNull: true
    },
    matiere: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    // Model options
    tableName: 'notifications',
    timestamps: true // This will add createdAt and updatedAt fields
});

module.exports = Notification;
