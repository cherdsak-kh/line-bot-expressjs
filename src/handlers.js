const line = require('@line/bot-sdk');
const config = require('./config');
const supabase = require('./supabase');
const { GoogleGenAI } = require('@google/genai');

// Create GenAI client
const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

// Create a new LINE SDK clients.
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.lineConfig.channelAccessToken,
});
const blobClient = new line.messagingApi.MessagingApiBlobClient({
  channelAccessToken: config.lineConfig.channelAccessToken,
});

/**
 * Helper function to download content from LINE
 * @param {string} messageId 
 * @returns {Promise<Object>} Base64 data object for Gemini
 */
const downloadLineContent = async (messageId) => {
  const stream = await blobClient.getMessageContent(messageId);
  const chunks = [];
  
  // รองรับทั้งแบบ Blob (มี arrayBuffer) และแบบ Stream
  if (stream.arrayBuffer) {
    const arrayBuffer = await stream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: stream.type || 'image/jpeg'
      },
      buffer: buffer
    };
  } else {
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'image/jpeg'
      },
      buffer: buffer
    };
  }
};

/**
 * Handle incoming events from the LINE Platform.
 * @param {Object} event - The webhook event object from LINE.
 * @returns {Promise}
 */
const handleEvent = async (event) => {
  // เราสนใจเฉพาะ event ประเภท message
  if (event.type !== 'message') {
    return Promise.resolve(null);
  }

  let replyText = '';
  let contentToSave = '';
  let replyMessages = null;

  try {
    if (event.message.type === 'text') {
      const userMessage = event.message.text.trim();
      contentToSave = userMessage;

      // Simple command routing
      if (userMessage.toLowerCase() === 'สวัสดี' || userMessage.toLowerCase() === 'hello') {
        replyText = 'สวัสดีครับ ยินดีต้อนรับสู่ LINE Bot ของเรา!';
      } else if (userMessage.toLowerCase() === 'help') {
        replyText = 'วิธีใช้งานเบื้องต้น:\n- พิมพ์ "สวัสดี" เพื่อทักทาย\n- พิมพ์ถามอะไรก็ได้ ผมจะใช้ AI ตอบให้\n- ส่งรูปภาพมา ผมก็จะช่วยอธิบายรูปให้ได้ครับ';
      } else {
        // ใช้ Gemini ในการตอบกลับแทน Echo
        const response = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: userMessage,
        });
        replyText = response.text;
      }
    } else if (event.message.type === 'image') {
      // ดาวน์โหลดรูปภาพจาก LINE และดึงมาทั้ง Base64 และ Buffer
      const imageContent = await downloadLineContent(event.message.id);
      
      const fileName = `images/${event.message.id}.jpg`;
      contentToSave = `[Image: ${fileName}]`;
      
      // อัปโหลดไฟล์ขึ้น Supabase Storage แบบ Asynchronous
      supabase.storage.from('SCS334_STORAGE').upload(fileName, imageContent.buffer, {
        contentType: 'image/jpeg',
        upsert: true
      }).then(({ error }) => {
        if (error) console.error('⚠️ Supabase Storage Upload Error:', error);
      });
      
      // ส่งให้ Gemini วิเคราะห์รูปภาพ
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          { inlineData: imageContent.inlineData },
          "ช่วยอธิบายรูปภาพนี้ให้หน่อยครับ แต่ถ้ารูปภาพนี้เป็นรูปสัตว์ ให้บอกแค่ชื่อสัตว์อย่างเดียวสั้นๆ ไม่ต้องอธิบายยาว"
        ]
      });
      replyText = `ส่งรูปภาพสำเร็จ! | ${response.text}`;
      replyMessages = [
        { type: 'text', text: 'ส่งรูปภาพสำเร็จ! 📸' },
        { type: 'text', text: response.text }
      ];
    } else if (event.message.type === 'sticker') {
      contentToSave = `[Sticker message]`;
      replyText = 'ขอบคุณสำหรับสติ๊กเกอร์ครับ 😊';
    } else {
      contentToSave = `[${event.message.type} message]`;
      replyText = 'ตอนนี้ผมเข้าใจแค่ข้อความและรูปภาพนะครับ';
    }
  } catch (error) {
    console.error('⚠️ Error processing message with Gemini:', error);
    replyText = 'ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผลข้อความของคุณ';
  }

  // 1. บันทึกข้อมูลลง Supabase (Asynchronous ไม่บล็อกการตอบกลับ)
  supabase.from('messages').insert([{
    user_id: event.source.userId || 'unknown',
    message_id: event.message.id,
    type: event.message.type,
    content: contentToSave,
    reply_token: event.replyToken,
    reply_content: replyText,
  }]).then(({ error }) => {
    if (error) console.error('⚠️ Supabase Error:', error);
  });

  // 2. ส่งข้อความตอบกลับผู้ใช้
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: replyMessages || [
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
