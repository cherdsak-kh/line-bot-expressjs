const express = require('express');
const fs = require('fs');
const path = require('path');
const line = require('@line/bot-sdk');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const config = require('./config');
const { handleEvent } = require('./handlers');

const app = express();
const homeTemplatePath = path.join(__dirname, 'templates', 'home.html');

// Setup basic middlewares (CORS & Logging)
app.use(cors());
app.use(morgan('dev')); // Log HTTP requests

// Setup Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Setup Home Route
app.get('/', (req, res) => {
  const studentName = 'เชิดศักดิ์ คำไล้';
  const studentId = '67222420006';
  const swaggerUrl = `${req.protocol}://${req.get('host')}/api-docs`;
  const homeTemplate = fs.readFileSync(homeTemplatePath, 'utf8');
  const html = homeTemplate
    .replace('{{STUDENT_NAME}}', studentName)
    .replace('{{STUDENT_ID}}', studentId)
    .replace('{{SWAGGER_URL}}', swaggerUrl);

  res.send(html);
});

// Setup Personal Info Route
/**
 * @swagger
 * /personal-info:
 *   get:
 *     summary: ข้อมูลส่วนตัวนักศึกษา
 *     tags: [Personal Info]
 *     description: ตอบกลับข้อมูลส่วนตัวนักศึกษาในรูปแบบ JSON
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstName:
 *                   type: string
 *                   example: "ชื่อ"
 *                 lastName:
 *                   type: string
 *                   example: "สกุล"
 *                 studentId:
 *                   type: string
 *                   example: "1234567890"
 *                 major:
 *                   type: string
 *                   example: "สาขา"
 *                 faculty:
 *                   type: string
 *                   example: "คณะ"
 *                 university:
 *                   type: string
 *                   example: "มหาวิทยาลัย"
 */
app.get('/personal-info', (req, res) => {
  res.json({
    firstName: 'เชิดศักดิ์',
    lastName: 'คำไล้',
    studentId: '67222420006',
    major: 'วิทยาการคอมพิวเตอร์',
    faculty: 'คณะวิทยาศาสตร์และเทคโนโลยี',
    university: 'มหาวิทยาลัยราชภัฏวไลยอลงกรณ์ ในพระบรมราชูปถัมภ์',
  });
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
app.listen(config.port, () => {
  console.log(`\n🚀 Server is running at http://localhost:${config.port}`);
  console.log(`📄 Swagger documentation available at http://localhost:${config.port}/api-docs`, '\n');
});
