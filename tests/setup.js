const sequelize = require('../config/database');

// Mock RabbitMQ avant tout chargement de module qui l'importerait
jest.mock('amqplib', () => ({
    connect: jest.fn().mockResolvedValue({
            createChannel: jest.fn().mockResolvedValue({
            assertExchange: jest.fn(),
            assertQueue: jest.fn(),
            bindQueue: jest.fn(),
            consume: jest.fn(),
            sendToQueue: jest.fn(),
        }),
    }),
}));

// Mock Eureka (le client ne doit pas tenter de se connecter)
jest.mock('eureka-js-client', () => ({
    Eureka: jest.fn().mockImplementation(() => ({
        start: jest.fn((callback) => callback && callback()),
        stop: jest.fn(),
    })),
}));

// Mock Socket.io global
global.io = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
};

// Éviter que le consumer RabbitMQ ne démarre réellement pendant les tests
jest.mock('../config/rabbitmq', () => ({
    startConsumer: jest.fn(() => Promise.resolve()),
}));

// Nettoyage avant chaque test
beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
});

// afterAll(async () => {
//     await sequelize.close();
// });