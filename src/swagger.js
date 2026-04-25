const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LINE Bot Webhook API',
      version: '1.0.0',
      description: 'API documentation for LINE Bot Webhook endpoint',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Local Development Server',
      },
    ],
  },
  apis: ['./src/index.js', './src/handlers.js'], // Files containing annotations
};

const specs = swaggerJsdoc(options);

module.exports = specs;
