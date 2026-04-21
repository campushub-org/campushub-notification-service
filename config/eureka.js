const Eureka = require('eureka-js-client').Eureka;
const os = require('os');

const PORT = parseInt(process.env.PORT || '3000', 10);
const EUREKA_HOST = process.env.EUREKA_HOST || 'campushub-registry';
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;
const SERVICE_NAME = 'campushub-notification-service';

const client = new Eureka({
  instance: {
    instanceId: `${os.hostname()}:${SERVICE_NAME}:${PORT}`,
    app: SERVICE_NAME,
    hostName: 'campushub-notification-service',
    ipAddr: 'campushub-notification-service',
    homePageUrl: `http://campushub-notification-service:${PORT}/`,
    statusPageUrl: `http://campushub-notification-service:${PORT}/health`,
    healthCheckUrl: `http://campushub-notification-service:${PORT}/health`,
    port: {
      '$': PORT,
      '@enabled': 'true',
    },
    vipAddress: SERVICE_NAME,
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    host: EUREKA_HOST,
    port: EUREKA_PORT,
    servicePath: '/eureka/apps/',
    maxRetries: 10,
    requestRetryDelay: 2000,
  },
});

function startEurekaClient(server) {
  client.start(error => {
      if (error) {
          console.log('Eureka registration failed:', error);
      } else {
          console.log('Eureka registration successful');
      }
  });

  function exitHandler(options, exitCode) {
      if (options.cleanup) {
          client.stop(() => {
              console.log('De-registered from Eureka');
          });
      }
      if (exitCode || exitCode === 0) console.log(exitCode);
      if (options.exit) process.exit();
  }

  process.on('exit', exitHandler.bind(null,{cleanup:true}));
  process.on('SIGINT', exitHandler.bind(null, {exit:true}));
  process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
  process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));
  process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
}

module.exports = startEurekaClient;
