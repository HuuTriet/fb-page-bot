import dotenv from 'dotenv';
dotenv.config();

const required = [
  'FB_APP_SECRET',
  'FB_PAGE_ID',
  'FB_PAGE_ACCESS_TOKEN',
  'FB_VERIFY_TOKEN',
  'GROQ_API_KEY',
];
for (const k of required) {
  if (!process.env[k]) {
    console.warn(`[config] Missing ${k} — features depending on it will fail.`);
  }
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  fb: {
    appId: process.env.FB_APP_ID,
    appSecret: process.env.FB_APP_SECRET,
    pageId: process.env.FB_PAGE_ID,
    pageAccessToken: process.env.FB_PAGE_ACCESS_TOKEN,
    verifyToken: process.env.FB_VERIFY_TOKEN,
    apiVersion: 'v21.0',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  admin: {
    token: process.env.ADMIN_TOKEN || '',
  },
  timezone: process.env.TIMEZONE || 'Asia/Ho_Chi_Minh',
};
