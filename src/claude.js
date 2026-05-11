import { config } from './config.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function groqChat({ system, messages, maxTokens = 512 }) {
  const body = {
    model: config.groq.model,
    max_tokens: maxTokens,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages,
    ],
  };

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.groq.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq ${res.status}: ${txt}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function generateReply({ systemPrompt, userMessage, context = [] }) {
  const messages = [...context, { role: 'user', content: userMessage }];
  return groqChat({ system: systemPrompt, messages, maxTokens: 512 });
}

export async function shouldHideComment(text, blacklistContext = '') {
  const sys =
    'Bạn phân loại comment Facebook. Trả về CHÍNH XÁC một JSON object có dạng ' +
    '{"hide": true|false, "reason": "..."}.\n' +
    'Ẩn nếu: chửi tục, công kích cá nhân, ngôn từ thù ghét, spam quảng cáo trắng trợn.\n' +
    'KHÔNG ẩn nếu chỉ là ý kiến tiêu cực bình thường, phàn nàn về sản phẩm.\n' +
    (blacklistContext ? `Ngữ cảnh fanpage: ${blacklistContext}\n` : '') +
    'Chỉ trả về JSON, không có text khác.';

  const txt = await groqChat({
    system: sys,
    messages: [{ role: 'user', content: text }],
    maxTokens: 200,
  });

  try {
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return { hide: false, reason: 'no_json' };
    return JSON.parse(m[0]);
  } catch {
    return { hide: false, reason: 'parse_failed' };
  }
}
