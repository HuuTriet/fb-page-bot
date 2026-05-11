import axios from 'axios';
import { config } from './config.js';

const BASE = `https://graph.facebook.com/${config.fb.apiVersion}`;
const token = () => config.fb.pageAccessToken;

export async function sendMessengerText(recipientId, text) {
  const { data } = await axios.post(
    `${BASE}/me/messages`,
    {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    },
    { params: { access_token: token() } }
  );
  return data;
}

export async function replyComment(commentId, message) {
  const { data } = await axios.post(
    `${BASE}/${commentId}/comments`,
    { message },
    { params: { access_token: token() } }
  );
  return data;
}

export async function hideComment(commentId, hide = true) {
  const { data } = await axios.post(
    `${BASE}/${commentId}`,
    { is_hidden: hide },
    { params: { access_token: token() } }
  );
  return data;
}

export async function publishPost({ message, link, scheduled_publish_time }) {
  const body = { message };
  if (link) body.link = link;
  if (scheduled_publish_time) {
    body.published = false;
    body.scheduled_publish_time = scheduled_publish_time;
  }
  const { data } = await axios.post(
    `${BASE}/${config.fb.pageId}/feed`,
    body,
    { params: { access_token: token() } }
  );
  return data;
}

export async function getPageInsights(metrics, period = 'day', since, until) {
  const params = {
    access_token: token(),
    metric: metrics.join(','),
    period,
  };
  if (since) params.since = since;
  if (until) params.until = until;
  const { data } = await axios.get(`${BASE}/${config.fb.pageId}/insights`, { params });
  return data;
}

export async function getPostStats(postId) {
  const { data } = await axios.get(`${BASE}/${postId}`, {
    params: {
      access_token: token(),
      fields:
        'message,created_time,permalink_url,' +
        'reactions.summary(total_count),' +
        'comments.summary(total_count),' +
        'shares,' +
        'insights.metric(post_impressions,post_engaged_users)',
    },
  });
  return data;
}

export async function getRecentPosts(limit = 10) {
  const { data } = await axios.get(`${BASE}/${config.fb.pageId}/posts`, {
    params: {
      access_token: token(),
      limit,
      fields:
        'id,message,created_time,permalink_url,' +
        'reactions.summary(total_count),' +
        'comments.summary(total_count)',
    },
  });
  return data;
}
