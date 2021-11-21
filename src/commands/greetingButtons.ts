import {clarifyReply} from '@helpers/clarifyReply';
import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot, Context} from '@root/types/index';
import {localizations} from '@helpers/strings';
import {checkLock} from '@middlewares/checkLock';
import {getReplyToMessageText} from '@root/types/hacks/get-message-text';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupGreetingButtons(bot: Bot): void {
  // Setup command
  bot.command(
    'greetingButtons',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      assertNonNullish(ctx.message);

      await ctx.replyWithMarkdown(
        `${ctx.translate('greetingButtons')}`,
        Extra.inReplyTo(ctx.message.message_id)
          .webPreview(false)
          .notifications(!ctx.dbchat.silentMessages),
      );
      await ctx.replyWithMarkdown(
        `<code>${
          ctx.dbchat.greetingButtons || ctx.translate('greetingButtonsEmpty')
        }</code>`,
        Extra.webPreview(false)
          .HTML(true)
          .notifications(!ctx.dbchat.silentMessages),
      );
      await clarifyReply(ctx);
    },
  );
  // Setup checker
  bot.use(async (ctx: Context, next: () => void): Promise<void> => {
    try {
      // Check if reply
      if (!ctx.message || !ctx.message.reply_to_message) {
        return;
      }
      // Check if text
      if (!ctx.message.text) {
        return;
      }
      // Check if reply to shieldy
      if (
        !bot.botInfo ||
        !ctx.message.reply_to_message.from ||
        !ctx.message.reply_to_message.from.username ||
        ctx.message.reply_to_message.from.username !== bot.botInfo.username
      ) {
        return;
      }
      // Check if reply to the correct message
      const greetingButtonsMessages = Object.keys(
        localizations.greetingButtons,
      ).map((k) => localizations.greetingButtons[k]);
      if (
        !getReplyToMessageText(ctx) ||
        greetingButtonsMessages.indexOf(getReplyToMessageText(ctx)) < 0
      ) {
        return;
      }
      // Check format
      const components = ctx.message.text.split('\n');
      const result: string[] = [];
      for (const component of components) {
        const parts = component.split(' - ');
        if (parts.length !== 2) {
          // Default
          ctx.dbchat.greetingButtons = undefined;
          await ctx.appContext.database.setChatProperty({
            chatId: ctx.dbchat.id,
            property: 'greetingButtons',
            value: ctx.dbchat.greetingButtons,
          });
          return;
        } else {
          result.push(component);
        }
      }
      // Save text
      ctx.dbchat.greetingButtons = result.join('\n');
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'greetingButtons',
        value: ctx.dbchat.greetingButtons,
      });
      ctx.reply(
        ctx.translate('greetsUsers_message_accepted'),
        Extra.inReplyTo(ctx.message.message_id),
      );
    } catch (err) {
      ctx.appContext.report(err);
    } finally {
      next();
    }
  });
}
