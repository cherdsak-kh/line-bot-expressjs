# LINE Bot with Express.js 🚀

โปรเจกต์พื้นฐานสำหรับการพัฒนา **LINE Bot** ด้วยเทคโนโลยี Webhook แบบเบาๆ โดยใช้ **Express.js** ร่วมกับแพ็กเกจอย่างเป็นทางการ **@line/bot-sdk** ออกแบบมาเพื่อให้เริ่มต้นนำไปต่อยอดพัฒนาได้อย่างรวดเร็ว

## ✨ ฟีเจอร์หลัก (Features)
- 💬 **LINE Messaging API**: รองรับการรับ-ส่งข้อความ รูปภาพ และสติ๊กเกอร์ จากแพลตฟอร์ม LINE
- 🤖 **Gemini AI Integration**: ผนวก `gemini-flash-latest` เป็นมันสมองหลัก สามารถพูดคุยโต้ตอบและวิเคราะห์ภาพ (Multimodal) ได้อย่างชาญฉลาด
- 🗄️ **Supabase Database**: เก็บบันทึกประวัติแชท (Message Logs) ลงฐานข้อมูลอัตโนมัติ
- ☁️ **Supabase Storage**: เมื่อผู้ใช้ส่งรูปภาพ ระบบจะดาวน์โหลดและสำรองภาพไปเก็บไว้ใน Cloud Storage (SCS334_STORAGE)
- ⚡ **Express.js**: ทำงานรวดเร็ว ยืดหยุ่น และจัดการ Routing ได้ง่าย
- 🌐 **ngrok Manual Mode**: รองรับการใช้งาน ngrok แบบแยกผ่าน Command Line
- 📖 **Swagger UI**: มีระบบสร้าง API Documentation แบบอัตโนมัติ (ดูได้ที่ `/api-docs`)
- 🔄 **Auto-Reload**: ใช้ `nodemon` ช่วยให้เซิร์ฟเวอร์โหลดใหม่ทันทีเมื่อมีการแก้ไขไฟล์โค้ด
---

## 🛠️ โครงสร้างโปรเจกต์ (Project Structure)
```text
line-bot-expressjs/
├── src/
│   ├── config.js                # โหลดและจัดการตัวแปร Environment (.env)
│   ├── handlers.js              # ตรรกะจัดการข้อความ (Event Handlers) จากผู้ใช้
│   ├── index.js                 # ไฟล์หลัก เริ่ม Express server และตั้งค่า Webhook
│   ├── supabase.js              # จัดการการเชื่อมต่อกับ Supabase
│   └── swagger.js               # การตั้งค่าสำหรับ Swagger API Docs
├── .env                         # ไฟล์เก็บความลับ (Tokens, Secrets) - สร้างเองจาก .env.example
├── package.json                 # จัดการ Dependencies และ Scripts
└── README.md                    # เอกสารอธิบายโปรเจกต์
```

---

## ⚙️ สิ่งที่ต้องเตรียม (Prerequisites)
1. ติดตั้ง **[Node.js](https://nodejs.org/)** (แนะนำเวอร์ชัน 18 ขึ้นไป)
2. มีบัญชี **[LINE Developers](https://developers.line.biz/)** พร้อมสร้าง Provider และ Channel
3. มีบัญชี **[Supabase](https://supabase.com/)** สร้าง Project และกำหนด Database/Storage (ตั้งชื่อ Bucket ว่า `SCS334_STORAGE`)
4. ได้รับ **[Gemini API Key](https://aistudio.google.com/)** จาก Google AI Studio
5. มีบัญชี **[ngrok](https://ngrok.com/)** สำหรับขอ AuthToken

---

## 🚀 การติดตั้งและใช้งาน (Installation & Setup)

### 1. โคลนโปรเจกต์และติดตั้งแพ็กเกจ
```bash
git clone https://github.com/cherdsak-kh/line-bot-expressjs.git
cd line-bot-expressjs
npm install
```

### 2. ตั้งค่าไฟล์ Environment
สร้างไฟล์ชื่อ `.env` ไว้ที่โฟลเดอร์หลักของโปรเจกต์ แล้วกำหนดค่าต่อไปนี้ (นำข้อมูลมาจาก LINE Developers Console):

```env
PORT=3000

# LINE Developers Console
LINE_CHANNEL_ACCESS_TOKEN=ใส่_Channel_Access_Token_ของคุณที่นี่
LINE_CHANNEL_SECRET=ใส่_Channel_Secret_ของคุณที่นี่

# Supabase Credentials
SUPABASE_URL=ใส่_Supabase_URL_ของคุณที่นี่
SUPABASE_KEY=ใส่_Supabase_Anon_Key_ของคุณที่นี่

# Gemini API
GEMINI_API_KEY=ใส่_Gemini_API_Key_ของคุณที่นี่
```

### 3. รันเซิร์ฟเวอร์
```bash
npm run dev
```
เซิร์ฟเวอร์จะถูกรันขึ้นมาที่พอร์ต 3000 สำหรับรับ Webhook ที่ endpoint `/webhook`

### 4. รัน ngrok แบบแยก
เปิดอีก Terminal หนึ่งแล้วรัน:

```bash
npx ngrok http 3000
```

จากนั้นนำ URL ที่ได้มาต่อท้าย `/webhook` เช่น `https://1234-abcd.ngrok-free.app/webhook`

### 5. เชื่อมต่อ Webhook
ให้นำ Webhook URL จากขั้นตอนที่ 4 ไปกรอกลงใน **LINE Developers Console** > เมนู **Messaging API** > **Webhook URL** จากนั้นกด `Verify` และอย่าลืมกดสวิตช์เปิด `Use webhook`

---

## 📚 การทดสอบ (Testing)
เมื่อตั้งค่าเสร็จสิ้น คุณสามารถทักแชทไปหา LINE Bot ของคุณเพื่อทดสอบระบบได้เลย 
ระบบเริ่มต้น (Default) ถูกตั้งค่าไว้ดังนี้:
- พิมพ์คำว่า **"สวัสดี"** หรือ **"hello"** -> บอทจะกล่าวต้อนรับ
- พิมพ์คำว่า **"help"** -> บอทจะแสดงคำแนะนำ
- พิมพ์ข้อความอื่นๆ -> บอทจะใช้ **Gemini AI** เพื่อโต้ตอบกับคุณ
- ส่ง **รูปภาพ** -> บอทจะอัปโหลดรูปภาพเก็บลง Supabase Storage และให้ Gemini ช่วยวิเคราะห์รูปภาพ
- ส่ง **สติ๊กเกอร์** -> บอทจะกล่าวขอบคุณสำหรับสติ๊กเกอร์

ข้อมูลแชททั้งหมดจะถูกบันทึก (Log) ลงในฐานข้อมูล Supabase อัตโนมัติ!
คุณสามารถเข้าไปแก้ไขตรรกะการตอบกลับเหล่านี้ได้ที่ไฟล์ `src/handlers.js`

## 📖 API Documentation
สามารถดูรายละเอียด API Endpoint ของระบบผ่านทางหน้า **Swagger UI** ได้ โดยเปิดเบราว์เซอร์แล้วเข้าไปที่:
- `http://localhost:3000/api-docs` (หากใช้งานผ่าน Local)
- `https://<your-ngrok-url>.ngrok-free.app/api-docs` (หากรัน ngrok ไว้)

*(หมายเหตุ: หากเข้าผ่าน ngrok ครั้งแรกอาจจะมีหน้าจอแจ้งเตือนความปลอดภัยจาก ngrok ให้กดปุ่ม `Visit Site` เพื่อไปต่อได้เลย หน้าจอนี้ไม่มีผลกระทบต่อการทำงานของ LINE Webhook ใดๆ)*
