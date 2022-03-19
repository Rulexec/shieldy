import {
  removeCandidates,
  removeRestrictedUsers,
} from '@helpers/restrictedUsers';
import {Context} from '@root/types/index';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const trustCommand = commandHandler(
  async (ctx: Context): Promise<void> => {
    const {
      appContext: {telegramApi},
      dbchat: chat,
      message,
    } = ctx;

    assertNonNullish(message);

    // Check if it is a handle message
    const handle = message.text.substr(7).replace('@', '');
    let handleId: number | undefined;
    if (handle) {
      for (const c of chat.candidates) {
        if (c.username === handle) {
          handleId = c.id;
          break;
        }
      }
    }
    // Check if reply
    if (!message.reply_to_message && !handleId) {
      return;
    }

    assertNonNullish(message.reply_to_message?.from);

    // Get replied
    const repliedId = handleId || message.reply_to_message.from.id;
    // Unrestrict in Telegram
    try {
      await ctx.telegram.restrictChatMember(chat.id, repliedId, {
        permissions: {
          can_send_messages: true,
          can_send_media_messages: true,
          can_send_other_messages: true,
          can_add_web_page_previews: true,
        },
      });
    } catch (err) {
      ctx.appContext.report(err);
    }
    // Unrestrict in shieldy
    removeRestrictedUsers({
      appContext: ctx.appContext,
      chat,
      candidatesAndUsers: [{id: repliedId}],
    });
    // Remove from candidates
    const candidate = chat.candidates.filter((c) => c.id === repliedId).pop();
    if (candidate) {
      if (candidate.messageId) {
        // Delete message
        await ctx.deleteMessageSafe({
          chatId: chat.id,
          messageId: candidate.messageId,
        });
      }

      // Remove from candidates
      removeCandidates({
        appContext: ctx.appContext,
        chat,
        candidatesAndUsers: [{id: repliedId}],
      });
    }
    // Reply with success
    await telegramApi.sendMessage({
      chat_id: chat.id,
      reply_to_message_id: message.message_id,
      disable_notification: chat.silentMessages,
      text: ctx.translate(T_`trust_success`),
    });
  },
);
