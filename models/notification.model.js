module.exports = (sequelize, DataTypes) => {
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
        enseignantId: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        titre: {
            type: DataTypes.STRING,
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
        }
    }, {
        tableName: 'notifications',
        timestamps: true
    });

    return Notification;
};
