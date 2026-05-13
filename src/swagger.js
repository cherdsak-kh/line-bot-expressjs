const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SCS334 - API DOCS (Cherdsak Kh.)',
      version: '1.0.0',
      description: 'เอกสารคู่มือ API สำหรับรายวิชา SCS334',
    },
    // servers: [
    //   {
    //     url: `http://localhost:${config.port}`,
    //     description: 'SCS334',
    //   },
    // ],
  },
  apis: ['./src/index.js', './src/handlers.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
