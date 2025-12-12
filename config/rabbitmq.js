const amqp = require('amqplib');
const notificationController = require('../controllers/notification.controller'); // Import the notification controller

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
                    const notificationPayload = JSON.parse(msg.content.toString());
                    console.log(" [x] Received payload: %s", JSON.stringify(notificationPayload, null, 2));
                    
                    // The payload itself contains recipientUserIds and the notification data
                    await notificationController.createNotification(notificationPayload);
                    console.log(" [✔] Notification and user notifications saved to database.");

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
