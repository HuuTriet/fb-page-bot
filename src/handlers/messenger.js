import { sendMessengerText } from '../facebook.js';
import { generateReply } from '../claude.js';
import { settingsDb } from '../storage.js';

const MAX_HISTORY_TURNS = 8;

export async function handleMessengerEvent(event) {
  const cfg = settingsDb.data;
  if (!cfg.features.autoReplyMessenger) return;

  const senderId = event.sender?.id;
  const text = event.message?.text;

  if (!senderId || !text) return;
  if (event.message.is_echo) return;

  const history = cfg.conversationHistory[senderId] || [];

  let reply;
  try {
    reply = await generateReply({
      systemPrompt: cfg.messengerPrompt,
      userMessage: text,
      context: history,
    });
  } catch (err) {
    console.error('[messenger] AI error:', err.message);
    reply = 'Xin lỗi, mình đang gặp lỗi. Sẽ có người trả lời bạn sớm nhé!';
  }

  try {
    await sendMessengerText(senderId, reply);
  } catch (err) {
    console.error('[messenger] send error:', err.response?.data || err.message);
    return;
  }

  const updated = [
    ...history,
    { role: 'user', content: text },
    { role: 'assistant', content: reply },
  ];
  cfg.conversationHistory[senderId] = updated.slice(-MAX_HISTORY_TURNS * 2);
  await settingsDb.write();
}
