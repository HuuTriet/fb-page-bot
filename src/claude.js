import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

function extractText(content) {
  return content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

export async function generateReply({ systemPrompt, userMessage, context = [] }) {
  const messages = [...context, { role: 'user', content: userMessage }];

  const res = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 512,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  });

  return extractText(res.content);
}

export async function shouldHideComment(text, blacklistContext = '') {
  const sys =
    'Bạn phân loại comment Facebook. Trả về CHÍNH XÁC một JSON object có dạng ' +
    '{"hide": true|false, "reason": "..."}.\n' +
    'Ẩn nếu: chửi tục, công kích cá nhân, ngôn từ thù ghét, spam quảng cáo trắng trợn.\n' +
    'KHÔNG ẩn nếu chỉ là ý kiến tiêu cực bình thường, phàn nàn về sản phẩm.\n' +
    (blacklistContext ? `Ngữ cảnh fanpage: ${blacklistContext}\n` : '') +
    'Chỉ trả về JSON, không có text khác.';

  const res = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: 200,
    system: sys,
    messages: [{ role: 'user', content: text }],
  });

  const txt = extractText(res.content);
  try {
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return { hide: false, reason: 'no_json' };
    return JSON.parse(m[0]);
  } catch {
    return { hide: false, reason: 'parse_failed' };
  }
}
