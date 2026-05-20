const line = require('@line/bot-sdk');
const config = require('./config');
const supabase = require('./supabase');
const { GoogleGenAI } = require('@google/genai');

// Create GenAI client
const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });

// In-Memory state for storing user's selected Gemini model
const userModels = new Map();

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
      if (userMessage.toLowerCase() === '/model') {
        replyMessages = [
          {
            type: 'text',
            text: 'กรุณาเลือกโมเดล Gemini ที่ต้องการใช้งานครับ:',
            quickReply: {
              items: [
                { type: 'action', action: { type: 'message', label: 'Gemini Flash Latest', text: '/setmodel gemini-flash-latest' } },
                { type: 'action', action: { type: 'message', label: 'Gemini 3.5 Flash', text: '/setmodel gemini-3.5-flash' } },
                { type: 'action', action: { type: 'message', label: 'Gemini 3 Flash', text: '/setmodel gemini-3-flash-preview' } },
                { type: 'action', action: { type: 'message', label: 'Gemini 3.1 FlashLite', text: '/setmodel gemini-3.1-flash-lite' } },
                { type: 'action', action: { type: 'message', label: 'Gemini 2.5 Flash', text: '/setmodel gemini-2.5-flash' } },
                { type: 'action', action: { type: 'message', label: 'Gemini 2.5 FlashLite', text: '/setmodel gemini-2.5-flash-lite' } }
              ]
            }
          }
        ];
        replyText = 'แสดงเมนูเลือกโมเดล';
      } else if (userMessage.toLowerCase().startsWith('/setmodel ')) {
        const selectedModel = userMessage.split(' ')[1];
        const userId = event.source.userId;
        if (userId) {
          userModels.set(userId, selectedModel);
        }
        replyText = `ตั้งค่าให้ใช้โมเดล ${selectedModel} เรียบร้อยแล้วครับ!`;
      } else if (userMessage.toLowerCase() === '/checkmodel' || userMessage.toLowerCase() === '/currentmodel') {
        const currentModel = userModels.get(event.source.userId) || 'gemini-3.1-flash-lite';
        replyText = `ตอนนี้คุณกำลังใช้งานโมเดล: ${currentModel} ครับ`;
      } else if (userMessage.toLowerCase() === 'สวัสดี' || userMessage.toLowerCase() === 'hello') {
        replyText = 'สวัสดีครับ ยินดีต้อนรับสู่ LINE Bot ของเรา!';
      } else if (userMessage.toLowerCase() === 'help') {
        replyText = 'วิธีใช้งานเบื้องต้น:\n- พิมพ์ "สวัสดี" เพื่อทักทาย\n- พิมพ์ถามอะไรก็ได้ ผมจะใช้ AI ตอบให้\n- ส่งรูปภาพมา ผมก็จะช่วยอธิบายรูปให้ได้ครับ\n- พิมพ์ "/model" เพื่อเลือกโมเดล AI\n- พิมพ์ "/checkmodel" เพื่อดูโมเดลที่กำลังใช้งานอยู่';
      } else {
        // ใช้ Gemini ในการตอบกลับแทน Echo
        const currentModel = userModels.get(event.source.userId) || 'gemini-3.1-flash-lite';
        try {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: userMessage,
          });
          replyText = response.text;
        } catch (error) {
          console.error('⚠️ Gemini API Error:', error.message || error);
          
          // ดักจับ Error 429 (Rate Limit / Quota Exceeded)
          if (error.status === 429) {
            replyText = 'ขออภัยครับ ตอนนี้ระบบ AI คิวเต็ม (โควต้าฟรีหมดชั่วคราว) ⏳ กรุณาลองใหม่อีกครั้งในภายหลังครับ 🙏';
          } else {
            replyText = 'ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้งครับ 😅';
          }
        }
      }
    } else if (event.message.type === 'image') {
      const targetId = event.source.userId || event.source.groupId || event.source.roomId;

      // ตอบกลับทันที (Reply) ว่าได้รับรูปภาพแล้ว เพื่อไม่ให้ผู้ใช้ต้องรอ
      replyText = 'ส่งรูปภาพสำเร็จ! กำลังให้ AI วิเคราะห์ รอสักครู่นะครับ 📸';
      replyMessages = [
        { type: 'text', text: replyText }
      ];
      contentToSave = `[Image Received: ${event.message.id}]`;

      // แยกการทำงานที่ใช้เวลานาน (ดาวน์โหลด, อัปโหลด, วิเคราะห์ AI) ไปทำเป็น Background Task
      (async () => {
        try {
          // ดาวน์โหลดรูปภาพจาก LINE และดึงมาทั้ง Base64 และ Buffer
          const imageContent = await downloadLineContent(event.message.id);
          
          const fileName = `images/${event.message.id}.jpg`;
          
          // อัปโหลดไฟล์ขึ้น Supabase Storage แบบ Asynchronous
          supabase.storage.from('SCS334_STORAGE').upload(fileName, imageContent.buffer, {
            contentType: 'image/jpeg',
            upsert: true
          }).then(({ error }) => {
            if (error) console.error('⚠️ Supabase Storage Upload Error:', error);
          });
          
          // ส่งให้ Gemini วิเคราะห์รูปภาพ
          const currentModel = userModels.get(event.source.userId) || 'gemini-3.1-flash-lite';
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: [
              { inlineData: imageContent.inlineData },
              "ช่วยอธิบายรูปภาพนี้ให้หน่อยครับ แต่ถ้ารูปภาพนี้เป็นรูปสัตว์ ให้บอกแค่ชื่อสัตว์อย่างเดียวสั้นๆ ไม่ต้องอธิบายยาว"
            ]
          });

          // ส่งคำตอบจาก AI กลับไปหาผู้ใช้ด้วยคำสั่ง Push Message
          if (targetId) {
            await client.pushMessage({
              to: targetId,
              messages: [{ type: 'text', text: response.text }]
            });

            // บันทึก Log ประวัติการตอบกลับของ AI (Push Message) ลง Supabase ด้วย
            supabase.from('messages').insert([{
              user_id: event.source.userId || 'unknown',
              message_id: `push-${Date.now()}`,
              type: 'text',
              content: `[AI Analysis for ${event.message.id}]`,
              reply_token: 'push_message',
              reply_content: response.text,
            }]).then(({ error }) => {
              if (error) console.error('⚠️ Supabase Error (Push Message):', error);
            });
          }
        } catch (error) {
          console.error('⚠️ Background Image Processing Error:', error);
          if (targetId) {
            await client.pushMessage({
              to: targetId,
              messages: [{ type: 'text', text: 'ขออภัยครับ เกิดข้อผิดพลาดขณะให้ AI วิเคราะห์รูปภาพ' }]
            }).catch(e => console.error('Failed to push error message:', e));
          }
        }
      })();
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
