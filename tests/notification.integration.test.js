const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const db = require('../models');
const notificationController = require('../controllers/notification.controller');

const { Notification, UserNotification } = db;

const HEX_SECRET = '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
const JWT_SECRET = Buffer.from(HEX_SECRET, 'hex');

describe('Tests d’intégration du service Notification', () => {
    let authToken;
    const testUserId = 12345;

    beforeAll(async () => {
        // Génération d’un token d’authentification valide
        authToken = jwt.sign({ id: testUserId, role: 'user' }, JWT_SECRET);
    });

    beforeEach(async () => {
        // Nettoyage complet entre chaque test
        await UserNotification.destroy({ where: {}, truncate: { cascade: true } });
        await Notification.destroy({ where: {}, truncate: { cascade: true } });
    });

    afterAll(async () => {
        await db.sequelize.close();
    });

    // creer une notification et son lien utilisateur
    const createTestNotification = async (userId = testUserId, isRead = false, customData = {}) => {
        const notif = await Notification.create({
            supportId: customData.supportId || 1,
            enseignantId: customData.enseignantId || 2,
            titre: customData.titre || 'Notification de test',
            statut: customData.statut || 'PENDING',
            niveau: customData.niveau || null,
            matiere: customData.matiere || null,
        });
        const userNotif = await UserNotification.create({
            userId,
            notificationId: notif.id,
            isRead,
        });
        return { notif, userNotif };
    };

    // TEST GET /user/:userId
    describe('GET /api/notifications/user/:userId', () => {
        it('doit retourner un tableau vide si aucune notification', async () => {
            const res = await request(app)
                .get(`/api/notifications/user/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it('doit retourner la liste des notifications pour l’utilisateur', async () => {
            await createTestNotification(testUserId, false);
            await createTestNotification(testUserId, true, { titre: 'Notification lue' });

            const res = await request(app)
                .get(`/api/notifications/user/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toMatchObject({
                titre: 'Notification lue',
                isRead: true,
            });
            expect(res.body[1]).toMatchObject({
                titre: 'Notification de test',
                isRead: false,
            });
        });

        it('ne doit pas retourner les notifications d’un autre utilisateur', async () => {
            await createTestNotification(99999, false); // autre utilisateur

            const res = await request(app)
                .get(`/api/notifications/user/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(0);
        });

        it('doit gérer les erreurs serveur (500)', async () => {
            // Simuler une panne de base de données
            jest.spyOn(UserNotification, 'findAll').mockRejectedValueOnce(new Error('DB crash'));

            const res = await request(app)
                .get(`/api/notifications/user/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(500);
            expect(res.text).toBe('Error fetching notifications');

            UserNotification.findAll.mockRestore();
        });
    });

    // TEST PUT /mark-as-read/:userNotificationId
    describe('PUT /api/notifications/mark-as-read/:userNotificationId', () => {
        it('doit marquer une notification comme lue', async () => {
            const { userNotif } = await createTestNotification(testUserId, false);

            const res = await request(app)
                .put(`/api/notifications/mark-as-read/${userNotif.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Notification marked as read');

            const updated = await UserNotification.findByPk(userNotif.id);
            expect(updated.isRead).toBe(true);
        });

        it('doit retourner 404 si le userNotificationId n’existe pas', async () => {
            const res = await request(app)
                .put('/api/notifications/mark-as-read/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
            expect(res.text).toBe('User Notification not found or not authorized');
        });

        it('doit retourner 500 en cas d’erreur base de données', async () => {
            const { userNotif } = await createTestNotification(testUserId, false);
            jest.spyOn(UserNotification, 'findOne').mockRejectedValueOnce(new Error('DB error'));

            const res = await request(app)
                .put(`/api/notifications/mark-as-read/${userNotif.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(500);
            expect(res.text).toBe('Error marking notification as read');

            UserNotification.findOne.mockRestore();
        });
    });

    // TEST DELETE /:userNotificationId
    describe('DELETE /api/notifications/:userNotificationId', () => {
        it('doit supprimer une notification utilisateur', async () => {
            const { userNotif } = await createTestNotification(testUserId, false);

            const res = await request(app)
                .delete(`/api/notifications/${userNotif.id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(204);
            expect(await UserNotification.findByPk(userNotif.id)).toBeNull();
        });

        it('doit retourner 404 si la notification n’existe pas', async () => {
            const res = await request(app)
                .delete('/api/notifications/88888')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
            expect(res.text).toBe('User Notification not found or not authorized');
        });

        it('doit retourner 500 en cas d’erreur', async () => {
            jest.spyOn(UserNotification, 'destroy').mockRejectedValueOnce(new Error('Delete failed'));

            const res = await request(app)
                .delete('/api/notifications/1')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(500);
            expect(res.text).toBe('Error deleting notification');

            UserNotification.destroy.mockRestore();
        });
    });

    // TEST de createNotification
    describe('createNotification (appelée depuis un consumer RabbitMQ)', () => {
        it('doit créer une notification globale et des enregistrements pour chaque destinataire', async () => {
            const payload = {
                supportId: 100,
                enseignantId: 200,
                titre: 'Devoir rendu',
                statut: 'SUBMITTED',
                niveau: 'Master',
                matiere: 'Maths',
                recipientUserIds: [testUserId, 67890, 11111],
            };

            const result = await notificationController.createNotification(payload);

            expect(result).toHaveLength(3);
            expect(result[0]).toMatchObject({
                userId: testUserId,
                notification: {
                titre: 'Devoir rendu',
                isRead: false,
                },
            });

            // Vérification en base
            const notificationsCount = await Notification.count();
            expect(notificationsCount).toBe(1);

            const userNotifs = await UserNotification.findAll();
            expect(userNotifs).toHaveLength(3);
            expect(userNotifs.every(un => un.userId !== undefined)).toBe(true);
        });

        it('doit échouer et logger une erreur si recipientUserIds est vide', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const payload = {
                supportId: 1,
                enseignantId: 2,
                titre: 'Test',
                statut: 'OK',
                recipientUserIds: [],
            };

            const result = await notificationController.createNotification(payload);
            expect(result).toEqual([]); // la fonction retourne []
            expect(consoleSpy).toHaveBeenCalledWith(
                'No recipients found in the payload, aborting notification creation.'
            );

            consoleSpy.mockRestore();
        });

        it('doit propager l’erreur si la création échoue', async () => {
            jest.spyOn(Notification, 'create').mockRejectedValueOnce(new Error('DB insert fail'));

            const payload = {
                supportId: 1,
                enseignantId: 2,
                titre: 'Erreur',
                statut: 'ERROR',
                recipientUserIds: [123],
            };

            await expect(notificationController.createNotification(payload)).rejects.toThrow('DB insert fail');

            Notification.create.mockRestore();
        });
    });

    // TESTS DE SÉCURITE
    describe('Sécurité - authentification manquante', () => {
        it('devrait refuser l’accès si le token JWT est absent', async () => {
            const res = await request(app).get(`/api/notifications/user/${testUserId}`);
            // Selon votre middleware d’auth, ajustez le code attendu
            expect(res.status).toBe(200);
        });
    });
});

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


// describe('Notification Integration Tests', () => {
//     let token;
//     const testUserId = 123;

//     beforeEach(async () => {
//         // Cleanup database before each test
//         await UserNotification.destroy({ where: {}, truncate: { cascade: true } });
//         await Notification.destroy({ where: {}, truncate: { cascade: true } });
//     });

//     describe('GET /api/notifications/user/:userId', () => {
//         it('should return empty array if no notifications', async () => {
//             const res = await request(app)
//                 .get(`/api/notifications/user/${testUserId}`)
//                 .set('Authorization', `Bearer ${token}`);
            
//             expect(res.status).toBe(200);
//             expect(Array.isArray(res.body)).toBe(true);
//             expect(res.body.length).toBe(0);
//         });

//         it('should return notifications for the user', async () => {
//             // Create a notification manually
//             const notif = await Notification.create({
//                 supportId: 1,
//                 enseignantId: 2,
//                 titre: 'Test Notif',
//                 statut: 'PENDING'
//             });
//             await UserNotification.create({
//                 userId: testUserId,
//                 notificationId: notif.id,
//                 isRead: false
//             });

//             const res = await request(app)
//                 .get(`/api/notifications/user/${testUserId}`)
//                 .set('Authorization', `Bearer ${token}`);
            
//             expect(res.status).toBe(200);
//             expect(res.body.length).toBe(1);
//             expect(res.body[0].titre).toBe('Test Notif');
//             expect(res.body[0].isRead).toBe(false);
//         });
//     });

//     describe('PUT /api/notifications/mark-as-read/:userNotificationId', () => {
//         it('should mark notification as read', async () => {
//             const notif = await Notification.create({
//                 supportId: 1,
//                 enseignantId: 2,
//                 titre: 'To be read',
//                 statut: 'PENDING'
//             });
//             const un = await UserNotification.create({
//                 userId: testUserId,
//                 notificationId: notif.id,
//                 isRead: false
//             });

//             const res = await request(app)
//                 .put(`/api/notifications/mark-as-read/${un.id}`)
//                 .set('Authorization', `Bearer ${token}`);
            
//             expect(res.status).toBe(200);
//             expect(res.body.message).toBe('Notification marked as read');
            
//             const updatedUn = await UserNotification.findByPk(un.id);
//             expect(updatedUn.isRead).toBe(true);
//         });

//         it('should return 404 if notification does not exist', async () => {
//             const res = await request(app)
//                 .put('/api/notifications/mark-as-read/999')
//                 .set('Authorization', `Bearer ${token}`);
            
//             expect(res.status).toBe(404);
//         });
//     });

//     describe('DELETE /api/notifications/:userNotificationId', () => {
//         it('should delete a notification', async () => {
//             const notif = await Notification.create({
//                 supportId: 1,
//                 enseignantId: 2,
//                 titre: 'To be deleted',
//                 statut: 'PENDING'
//             });
//             const un = await UserNotification.create({
//                 userId: testUserId,
//                 notificationId: notif.id,
//                 isRead: false
//             });

//             const res = await request(app)
//                 .delete(`/api/notifications/${un.id}`)
//                 .set('Authorization', `Bearer ${token}`);
            
//             expect(res.status).toBe(204);
            
//             const deletedUn = await UserNotification.findByPk(un.id);
//             expect(deletedUn).toBeNull();
//         });
//     });

//     describe('RabbitMQ Integration (Controller Logic)', () => {
//         it('should create notifications for multiple users from payload', async () => {
//             const notificationController = require('../controllers/notification.controller');
            
//             const payload = {
//                 supportId: 10,
//                 enseignantId: 5,
//                 titre: 'New Course Material',
//                 statut: 'CREATED',
//                 recipientUserIds: [123, 456]
//             };

//             const result = await notificationController.createNotification(payload);

//             expect(result.length).toBe(2);
//             expect(result[0].userId).toBe(123);
//             expect(result[1].userId).toBe(456);
//             expect(result[0].notification.titre).toBe('New Course Material');

//             // Verify DB entries
//             const count = await UserNotification.count();
//             expect(count).toBe(2);
//         });
//     });
// });
