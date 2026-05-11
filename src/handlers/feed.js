import { replyComment, hideComment } from '../facebook.js';
import { generateReply, shouldHideComment } from '../claude.js';
import { settingsDb } from '../storage.js';
import { config } from '../config.js';

export async function handleFeedChange(change) {
  const cfg = settingsDb.data;
  if (change.field !== 'feed') return;

  const v = change.value;
  if (v.item !== 'comment') return;
  if (v.verb !== 'add') return;
  if (v.from?.id === config.fb.pageId) return;

  const commentId = v.comment_id;
  const text = v.message;
  if (!commentId || !text) return;

  if (cfg.features.hideToxicComments) {
    try {
      const decision = await shouldHideComment(text, cfg.blacklistContext);
      if (decision.hide) {
        await hideComment(commentId, true);
        console.log(`[feed] hidden comment ${commentId}: ${decision.reason}`);
        return;
      }
    } catch (err) {
      console.error('[feed] toxic check error:', err.message);
    }
  }

  if (cfg.features.autoReplyComments) {
    try {
      const reply = await generateReply({
        systemPrompt: cfg.commentPrompt,
        userMessage: text,
      });
      await replyComment(commentId, reply);
      console.log(`[feed] replied to comment ${commentId}`);
    } catch (err) {
      console.error('[feed] reply error:', err.response?.data || err.message);
    }
  }
}
