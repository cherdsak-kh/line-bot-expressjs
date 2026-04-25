const line = require('@line/bot-sdk');
const config = require('./config');

// Create a new LINE SDK client.
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.lineConfig.channelAccessToken,
});

/**
 * Handle incoming events from the LINE Platform.
 * @param {Object} event - The webhook event object from LINE.
 * @returns {Promise}
 */
const handleEvent = async (event) => {
  // We only care about message events of type 'text'
  if (event.type !== 'message' || event.message.type !== 'text') {
    // For non-text messages like images/stickers
    if (event.type === 'message' && event.message.type !== 'text') {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: 'ตอนนี้ผมยังเข้าใจแค่ข้อความตัวอักษรนะครับ',
          },
        ],
      });
    }
    // Ignore other event types (e.g., follow, unfollow, join)
    return Promise.resolve(null);
  }

  const userMessage = event.message.text.trim().toLowerCase();
  let replyText = '';

  // Simple command routing
  if (userMessage === 'สวัสดี' || userMessage === 'hello') {
    replyText = 'สวัสดีครับ ยินดีต้อนรับสู่ LINE Bot ของเรา!';
  } else if (userMessage === 'help') {
    replyText = 'วิธีใช้งานเบื้องต้น:\n- พิมพ์ "สวัสดี" เพื่อทักทาย\n- พิมพ์อะไรก็ได้ ผมจะสะท้อนคำพูดของคุณกลับไป (Echo)';
  } else {
    // Echo back the original text
    replyText = event.message.text;
  }

  // Use reply API
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
      {
        type: 'text',
        text: replyText,
      },
    ],
  });
};

module.exports = {
  handleEvent,
};
