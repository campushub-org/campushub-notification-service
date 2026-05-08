const { Notification, UserNotification } = require('../../models');
const { faker } = require('@faker-js/faker');

const buildNotification = (overrides = {}) => ({
    supportId: faker.number.bigInt(),
    enseignantId: faker.number.bigInt(),
    titre: faker.lorem.sentence(),
    statut: faker.helpers.arrayElement(['PENDING', 'SENT', 'READ']),
    niveau: faker.helpers.maybe(() => faker.number.int({ min: 1, max: 12 })),
    matiere: faker.helpers.maybe(() => faker.word.noun()),
    ...overrides,
});

const createNotificationWithUsers = async (userIds, notifOverrides = {}) => {
    const notif = await Notification.create(buildNotification(notifOverrides));
    const userNotifs = await Promise.all(
        userIds.map(userId => UserNotification.create({ userId, notificationId: notif.id, isRead: false }))
    );
    return { notif, userNotifs };
};