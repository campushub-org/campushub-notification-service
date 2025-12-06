const amqp = require('amqplib');
const Notification = require('../models/notification.model');

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'guest';
const AMQP_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}`;

const EXCHANGE_NAME = 'support_exchange';
const QUEUE_NAME = 'support_notification_queue';
const ROUTING_KEY = 'support.notification';

async function startConsumer() {
    try {
        console.log('Connecting to RabbitMQ...');
        const connection = await amqp.connect(AMQP_URL);
        const channel = await connection.createChannel();

        console.log('Asserting exchange and queue...');
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        await channel.assertQueue(QUEUE_NAME, { durable: true });
        await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

        console.log('Waiting for messages in queue: %s', QUEUE_NAME);
        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg.content) {
                try {
                    const notificationData = JSON.parse(msg.content.toString());
                    console.log(" [x] Received notification data: %s", JSON.stringify(notificationData, null, 2));
                    
                    // Save notification to database
                    await Notification.create({
                        supportId: notificationData.supportId,
                        titre: notificationData.titre,
                        enseignantId: notificationData.enseignantId,
                        statut: notificationData.statut,
                        niveau: notificationData.niveau,
                        matiere: notificationData.matiere
                    });
                    console.log(" [✔] Notification saved to database.");

                } catch (e) {
                    console.error('Error processing message:', e);
                }
            }
        }, {
            noAck: true // Automatically acknowledge the message
        });

    } catch (error) {
        console.error('Failed to connect or consume from RabbitMQ:', error);
        // Retry connection after a delay
        setTimeout(startConsumer, 10000);
    }
}

module.exports = { startConsumer };
