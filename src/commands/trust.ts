import {
  removeCandidates,
  removeRestrictedUsers,
} from '@helpers/restrictedUsers';
import {Extra} from 'telegraf';
import {Context} from '@root/types/index';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const trustCommand = commandHandler(
  async (ctx: Context): Promise<void> => {
    assertNonNullish(ctx.message);

    // Check if it is a handle message
    const handle = ctx.message.text.substr(7).replace('@', '');
    let handleId: number | undefined;
    if (handle) {
      for (const c of ctx.dbchat.candidates) {
        if (c.username === handle) {
          handleId = c.id;
          break;
        }
      }
    }
    // Check if reply
    if (!ctx.message || (!ctx.message.reply_to_message && !handleId)) {
      return;
    }

    assertNonNullish(ctx.message.reply_to_message?.from);

    // Get replied
    const repliedId = handleId || ctx.message.reply_to_message.from.id;
    // Unrestrict in Telegram
    try {
      await ctx.telegram.restrictChatMember(ctx.dbchat.id, repliedId, {
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
      chat: ctx.dbchat,
      candidatesAndUsers: [{id: repliedId}],
    });
    // Remove from candidates
    const candidate = ctx.dbchat.candidates
      .filter((c) => c.id === repliedId)
      .pop();
    if (candidate) {
      if (candidate.messageId) {
        // Delete message
        await ctx.deleteMessageSafe({
          chatId: ctx.dbchat.id,
          messageId: candidate.messageId,
        });
      }

      // Remove from candidates
      removeCandidates({
        appContext: ctx.appContext,
        chat: ctx.dbchat,
        candidatesAndUsers: [{id: repliedId}],
      });
    }
    // Reply with success
    await ctx.replyWithMarkdown(
      ctx.translate(T_`trust_success`),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    );
  },
);
