const express = require('express');
const line = require('@line/bot-sdk');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const config = require('./config');
const { handleEvent } = require('./handlers');

const app = express();

// Setup basic middlewares (CORS & Logging)
app.use(cors());
app.use(morgan('dev')); // Log HTTP requests

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health Check Endpoint
 *     tags: [General]
 *     description: Returns a welcome message to indicate the server is running.
 *     responses:
 *       200:
 *         description: Welcome message
 */
app.get('/', (req, res) => {
  res.send('Welcome to LINE Bot Express.js Server! 🚀');
});

// Setup Webhook Route
// Note: LINE SDK middleware automatically parses the request body and verifies the signature.
// Therefore, we do NOT use express.json() before this route.

/**
 * @swagger
 * /webhook:
 *   post:
 *     summary: LINE Webhook endpoint
 *     tags: [LINE Bot]
 *     description: Receives events from the LINE Platform.
 *     responses:
 *       200:
 *         description: OK
 */
app.post('/webhook', line.middleware(config.lineConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Error handling event:', err);
      res.status(500).end();
    });
});

// Start the server
app.listen(config.port, async () => {
  console.log(`\n🚀 Server is running on port ${config.port}`);
  console.log(`📄 Swagger documentation available at http://localhost:${config.port}/api-docs`,'\n');

  // Start ngrok tunnel automatically in development environment (if enabled)
  if (config.nodeEnv === 'development' && config.enableNgrok) {
    try {
      const ngrok = require('@ngrok/ngrok');
      
      const listener = await ngrok.forward({
        addr: config.port,
        authtoken: config.ngrokAuthToken,
      });

      const url = listener.url();

      console.log(`\n🔗 ngrok tunnel is active!`);
      console.log(`🟢 Your Webhook URL is: ${url}/webhook`);
      console.log(`👉 Please update this URL in your LINE Developers Console\n`);

    } catch (error) {
      console.error('Failed to start ngrok tunnel. Error details:', error.message || error);
    }
  }
});
