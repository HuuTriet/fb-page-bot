import { Router } from 'express';
import crypto from 'node:crypto';
import { postsDb, settingsDb } from './storage.js';
import { config } from './config.js';

export const adminRouter = Router();

adminRouter.use((req, res, next) => {
  if (!config.admin.token) {
    return res.status(503).json({ error: 'ADMIN_TOKEN not configured' });
  }
  const auth = req.headers.authorization || '';
  const t = auth.replace(/^Bearer\s+/i, '');
  if (t !== config.admin.token) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
});

adminRouter.get('/posts', (req, res) => {
  res.json(postsDb.data);
});

adminRouter.post('/posts', async (req, res) => {
  const { message, link, publishAt } = req.body || {};
  if (!message || !publishAt) {
    return res.status(400).json({ error: 'message and publishAt (ISO 8601) required' });
  }
  const when = new Date(publishAt);
  if (isNaN(when.getTime())) {
    return res.status(400).json({ error: 'publishAt must be valid ISO 8601' });
  }
  const post = {
    id: crypto.randomUUID(),
    message,
    link: link || null,
    publishAt: when.toISOString(),
    published: false,
    createdAt: new Date().toISOString(),
  };
  postsDb.data.scheduled.push(post);
  await postsDb.write();
  res.status(201).json(post);
});

adminRouter.delete('/posts/:id', async (req, res) => {
  const before = postsDb.data.scheduled.length;
  postsDb.data.scheduled = postsDb.data.scheduled.filter((p) => p.id !== req.params.id);
  const removed = before - postsDb.data.scheduled.length;
  if (removed === 0) return res.status(404).json({ error: 'not found' });
  await postsDb.write();
  res.json({ removed });
});

adminRouter.get('/settings', (req, res) => {
  const { conversationHistory, ...safe } = settingsDb.data;
  res.json(safe);
});

adminRouter.patch('/settings', async (req, res) => {
  const allowed = ['features', 'messengerPrompt', 'commentPrompt', 'blacklistContext'];
  for (const key of Object.keys(req.body || {})) {
    if (allowed.includes(key)) settingsDb.data[key] = req.body[key];
  }
  await settingsDb.write();
  const { conversationHistory, ...safe } = settingsDb.data;
  res.json(safe);
});

adminRouter.delete('/conversations/:senderId', async (req, res) => {
  delete settingsDb.data.conversationHistory[req.params.senderId];
  await settingsDb.write();
  res.json({ ok: true });
});
