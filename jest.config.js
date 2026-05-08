module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./tests/setup.js'],
    collectCoverageFrom: ['controllers/**/*.js', 'models/**/*.js'],
};