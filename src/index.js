import express from 'express';
import { config } from './config.js';
import { webhookRouter } from './webhook.js';
import { adminRouter } from './admin.js';
import { analyticsRouter } from './analytics.js';
import { startScheduler } from './scheduler.js';

const app = express();

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.get('/', (_req, res) => {
  res.json({ ok: true, name: 'fb-page-bot', model: config.groq.model });
});

app.use('/webhook', webhookRouter);
app.use('/admin', adminRouter);
app.use('/analytics', analyticsRouter);

app.use((err, _req, res, _next) => {
  console.error('[express]', err);
  res.status(500).json({ error: 'internal' });
});

app.listen(config.port, () => {
  console.log(`[fb-page-bot] listening on :${config.port}`);
});

startScheduler();
