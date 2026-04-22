const { Sequelize } = require('sequelize');

const DB_NAME = process.env.DB_NAME || 'campushub_notification_db';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'root';
const DB_HOST = process.env.DB_HOST || 'localhost';

const isTest = process.env.NODE_ENV === 'test';

const sequelize = isTest 
    ? new Sequelize('sqlite::memory:', { logging: false })
    : new Sequelize(DB_NAME, DB_USER, DB_PASS, {
        host: DB_HOST,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });

const MAX_RETRIES = 10;
const RETRY_DELAY = 5000; // 5 seconds

async function connectWithRetry(retries = 0) {
    if (isTest) return; // Skip retry logic in tests
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        if (retries < MAX_RETRIES) {
            console.log(`Retrying database connection in ${RETRY_DELAY / 1000} seconds... (Attempt ${retries + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            await connectWithRetry(retries + 1);
        } else {
            console.error('Max retries reached. Could not connect to the database.');
            process.exit(1); // Exit if unable to connect after max retries
        }
    }
}

connectWithRetry();

module.exports = sequelize;
