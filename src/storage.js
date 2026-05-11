import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

async function load(file, defaults) {
  const db = new Low(new JSONFile(path.join(dataDir, file)), defaults);
  await db.read();
  if (!db.data) db.data = defaults;
  await db.write();
  return db;
}

export const postsDb = await load('posts.json', { scheduled: [], history: [] });

export const settingsDb = await load('settings.json', {
  features: {
    autoReplyMessenger: true,
    autoReplyComments: true,
    hideToxicComments: true,
    scheduledPosts: true,
  },
  messengerPrompt:
    'Bạn là trợ lý fanpage thân thiện, trả lời ngắn gọn bằng tiếng Việt. ' +
    'Không bịa thông tin. Nếu không biết, lịch sự nói sẽ có người trả lời sớm.',
  commentPrompt:
    'Bạn là trợ lý fanpage. Trả lời comment ngắn gọn, lịch sự, dưới 200 ký tự, ' +
    'bằng tiếng Việt. Không spam emoji, không quảng cáo.',
  blacklistContext: '',
  conversationHistory: {},
});
