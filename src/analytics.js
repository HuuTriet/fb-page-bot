import { Router } from 'express';
import { getPageInsights, getRecentPosts, getPostStats } from './facebook.js';

export const analyticsRouter = Router();

function fbError(err, res) {
  res.status(500).json({ error: err.response?.data || err.message });
}

analyticsRouter.get('/page', async (req, res) => {
  try {
    const data = await getPageInsights(
      ['page_impressions', 'page_post_engagements', 'page_fans'],
      req.query.period || 'day'
    );
    res.json(data);
  } catch (err) {
    fbError(err, res);
  }
});

analyticsRouter.get('/posts', async (req, res) => {
  try {
    const data = await getRecentPosts(Number(req.query.limit) || 10);
    res.json(data);
  } catch (err) {
    fbError(err, res);
  }
});

analyticsRouter.get('/posts/:id', async (req, res) => {
  try {
    const data = await getPostStats(req.params.id);
    res.json(data);
  } catch (err) {
    fbError(err, res);
  }
});
