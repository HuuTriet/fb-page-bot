import cron from 'node-cron';
import { postsDb } from './storage.js';
import { publishPost } from './facebook.js';
import { settingsDb } from './storage.js';
import { config } from './config.js';

export function startScheduler() {
  cron.schedule('* * * * *', tick, { timezone: config.timezone });
  console.log(`[scheduler] started, checking every minute (TZ=${config.timezone})`);
}

async function tick() {
  if (!settingsDb.data.features.scheduledPosts) return;

  const now = Date.now();
  const due = postsDb.data.scheduled.filter(
    (p) => !p.published && new Date(p.publishAt).getTime() <= now
  );
  if (due.length === 0) return;

  for (const p of due) {
    try {
      const res = await publishPost({ message: p.message, link: p.link });
      p.published = true;
      p.publishedAt = new Date().toISOString();
      p.fbPostId = res.id;
      postsDb.data.history.push({ ...p });
      console.log(`[scheduler] published ${p.id} → ${res.id}`);
    } catch (err) {
      p.error = err.response?.data?.error?.message || err.message;
      console.error(`[scheduler] failed ${p.id}:`, p.error);
    }
  }

  postsDb.data.scheduled = postsDb.data.scheduled.filter((p) => !p.published);
  await postsDb.write();
}
