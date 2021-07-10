import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {
  removeCandidates,
  removeRestrictedUsers,
} from '@helpers/restrictedUsers';
import {isGroup} from '@helpers/isGroup';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {botDeleteMessageSafe} from '@root/helpers/deleteMessageSafe';

export function setupBan(bot: Bot): void {
  bot.command('ban', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const fromUser = ctx.from;

    // Check if reply
    if (!ctx.message || !ctx.message.reply_to_message?.from?.id || !fromUser) {
      return;
    }
    // Check if not a group
    if (!isGroup(ctx)) {
      return;
    }
    // Get replied
    const repliedId = ctx.message.reply_to_message.from.id;
    // Check if sent by admin
    const admins = await ctx.getChatAdministrators();
    if (!admins.map((a) => a.user.id).includes(fromUser.id)) {
      return;
    }
    // Check permissions
    const admin = admins.find((v) => v.user.id === fromUser.id);
    if (admin && admin.status !== 'creator' && !admin.can_restrict_members) {
      return;
    }
    // Ban in Telegram
    await ctx.telegram.kickChatMember(ctx.dbchat.id, repliedId);
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
        await botDeleteMessageSafe(ctx.appContext, {
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
    await ctx.replyWithMarkdown(ctx.translate('trust_success'));
  });
}
