import { Router } from 'express';
import crypto from 'node:crypto';
import { config } from './config.js';
import { handleMessengerEvent } from './handlers/messenger.js';
import { handleFeedChange } from './handlers/feed.js';

export const webhookRouter = Router();

webhookRouter.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.fb.verifyToken) {
    console.log('[webhook] verified');
    return res.status(200).send(challenge);
  }
  console.warn('[webhook] verify failed');
  res.sendStatus(403);
});

webhookRouter.post('/', (req, res) => {
  if (config.fb.appSecret) {
    const sig = req.headers['x-hub-signature-256'] || '';
    const expected =
      'sha256=' +
      crypto
        .createHmac('sha256', config.fb.appSecret)
        .update(req.rawBody || '')
        .digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.warn('[webhook] invalid signature');
      return res.sendStatus(403);
    }
  }

  const body = req.body;
  res.sendStatus(200);

  (async () => {
    try {
      if (body.object !== 'page') return;
      for (const entry of body.entry || []) {
        for (const ev of entry.messaging || []) {
          await handleMessengerEvent(ev);
        }
        for (const ch of entry.changes || []) {
          await handleFeedChange(ch);
        }
      }
    } catch (err) {
      console.error('[webhook] dispatch error:', err);
    }
  })();
});
