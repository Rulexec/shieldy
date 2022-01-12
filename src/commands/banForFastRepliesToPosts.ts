import {botKickChatMember} from '@helpers/newcomers/kickChatMember';
import {deleteMessageSafe} from '@helpers/deleteMessageSafe';
import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot, Context} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

export function setupBanForFastRepliesToPosts(bot: Bot): void {
  // Reply to command
  bot.command(
    'banForFastRepliesToPosts',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      const chat = ctx.dbchat;
      chat.banForFastRepliesToPosts = !chat.banForFastRepliesToPosts;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'banForFastRepliesToPosts',
        value: chat.banForFastRepliesToPosts,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          chat.banForFastRepliesToPosts
            ? T_`banForFastRepliesToPosts_true`
            : T_`banForFastRepliesToPosts_false`,
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !ctx.dbchat.silentMessages,
        ),
      );
    },
  );
  // Save channel messages
  bot.use((ctx: Context, next: () => void): void => {
    const message = ctx.message;

    if (!message || !message.from || !ctx.dbchat.banForFastRepliesToPosts) {
      return next();
    }

    ctx.appContext.database
      .addCappedMessage({
        message_id: message.message_id,
        from_id: message.from.id,
        chat_id: message.chat.id,
        createdAt: new Date(),
      })
      .catch(ctx.appContext.report);

    next();
  });
  //
  bot.use(async (ctx, next) => {
    // Check if a reply to a channel post
    if (!ctx.message) {
      return next();
    }
    // Check if an admin
    if (ctx.isAdministrator) {
      return next();
    }
    // Check if needs checking
    if (!ctx.dbchat.banForFastRepliesToPosts) {
      return next();
    }
    // Check the message
    const now = Date.now();
    try {
      // Try to find this channel post
      const post = await ctx.appContext.database.findCappedMessage({
        message_id: ctx.message.reply_to_message?.message_id,
        from_id: ctx.message.reply_to_message?.from?.id,
        chat_id: ctx.message.reply_to_message?.chat.id,
      });
      if (!post) {
        return next();
      }
      if (now - post.createdAt.getTime() < 5 * 1000) {
        assertNonNullish(ctx.from);

        await botKickChatMember(ctx.appContext, ctx.dbchat, ctx.from);
        if (ctx.dbchat.deleteEntryOnKick) {
          await deleteMessageSafe(ctx);
        }
      }
    } catch {
      // Do nothing
    }
  });
}
