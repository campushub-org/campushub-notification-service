const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const db = require('../models');
const { Notification, UserNotification } = db;

// Mock RabbitMQ and Eureka to prevent connection attempts
jest.mock('amqplib', () => ({
    connect: jest.fn().mockResolvedValue({
        createChannel: jest.fn().mockResolvedValue({
            assertExchange: jest.fn(),
            assertQueue: jest.fn(),
            bindQueue: jest.fn(),
            consume: jest.fn(),
        }),
    }),
}));

jest.mock('eureka-js-client', () => ({
    Eureka: jest.fn().mockImplementation(() => ({
        start: jest.fn(),
        stop: jest.fn(),
    })),
}));

// Mock Socket.io global object
global.io = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
};

const HEX_SECRET = '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
const JWT_SECRET = Buffer.from(HEX_SECRET, 'hex');

describe('Notification Integration Tests', () => {
    let token;
    const testUserId = 123;

    beforeAll(async () => {
        // Sync database (SQLite memory)
        await db.sequelize.sync({ force: true });
        
        // Generate test token
        token = jwt.sign({ id: testUserId, username: 'testuser' }, JWT_SECRET);
    });

    beforeEach(async () => {
        // Cleanup database before each test
        await UserNotification.destroy({ where: {}, truncate: { cascade: true } });
        await Notification.destroy({ where: {}, truncate: { cascade: true } });
    });

    afterAll(async () => {
        await db.sequelize.close();
    });

    describe('GET /api/notifications/user/:userId', () => {
        it('should return empty array if no notifications', async () => {
            const res = await request(app)
                .get(`/api/notifications/user/${testUserId}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(0);
        });

        it('should return notifications for the user', async () => {
            // Create a notification manually
            const notif = await Notification.create({
                supportId: 1,
                enseignantId: 2,
                titre: 'Test Notif',
                statut: 'PENDING'
            });
            await UserNotification.create({
                userId: testUserId,
                notificationId: notif.id,
                isRead: false
            });

            const res = await request(app)
                .get(`/api/notifications/user/${testUserId}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
            expect(res.body[0].titre).toBe('Test Notif');
            expect(res.body[0].isRead).toBe(false);
        });
    });

    describe('PUT /api/notifications/mark-as-read/:userNotificationId', () => {
        it('should mark notification as read', async () => {
            const notif = await Notification.create({
                supportId: 1,
                enseignantId: 2,
                titre: 'To be read',
                statut: 'PENDING'
            });
            const un = await UserNotification.create({
                userId: testUserId,
                notificationId: notif.id,
                isRead: false
            });

            const res = await request(app)
                .put(`/api/notifications/mark-as-read/${un.id}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Notification marked as read');
            
            const updatedUn = await UserNotification.findByPk(un.id);
            expect(updatedUn.isRead).toBe(true);
        });

        it('should return 404 if notification does not exist', async () => {
            const res = await request(app)
                .put('/api/notifications/mark-as-read/999')
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(404);
        });
    });

    describe('DELETE /api/notifications/:userNotificationId', () => {
        it('should delete a notification', async () => {
            const notif = await Notification.create({
                supportId: 1,
                enseignantId: 2,
                titre: 'To be deleted',
                statut: 'PENDING'
            });
            const un = await UserNotification.create({
                userId: testUserId,
                notificationId: notif.id,
                isRead: false
            });

            const res = await request(app)
                .delete(`/api/notifications/${un.id}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(res.status).toBe(204);
            
            const deletedUn = await UserNotification.findByPk(un.id);
            expect(deletedUn).toBeNull();
        });
    });

    describe('RabbitMQ Integration (Controller Logic)', () => {
        it('should create notifications for multiple users from payload', async () => {
            const notificationController = require('../controllers/notification.controller');
            
            const payload = {
                supportId: 10,
                enseignantId: 5,
                titre: 'New Course Material',
                statut: 'CREATED',
                recipientUserIds: [123, 456]
            };

            const result = await notificationController.createNotification(payload);

            expect(result.length).toBe(2);
            expect(result[0].userId).toBe(123);
            expect(result[1].userId).toBe(456);
            expect(result[0].notification.titre).toBe('New Course Material');

            // Verify DB entries
            const count = await UserNotification.count();
            expect(count).toBe(2);
        });
    });
});
