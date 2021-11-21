import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot, Context} from '@root/types/index';
import {localizations} from '@helpers/strings';
import {checkLock} from '@middlewares/checkLock';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {clarifyReply} from '@helpers/clarifyReply';
import {isReplyToShieldy} from '@helpers/isReplyToShieldy';
import {getReplyToMessageText} from '@root/types/hacks/get-message-text';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupGreeting(bot: Bot): void {
  // Setup command
  bot.command('greeting', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const chat = ctx.dbchat;
    chat.greetsUsers = !chat.greetsUsers;
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'greetsUsers',
      value: chat.greetsUsers,
    });

    assertNonNullish(ctx.message);

    await ctx.replyWithMarkdown(
      ctx.translate(
        chat.greetsUsers
          ? chat.greetingMessage
            ? 'greetsUsers_true_message'
            : 'greetsUsers_true'
          : 'greetsUsers_false',
      ),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    );
    if (chat.greetingMessage && chat.greetsUsers) {
      // TODO: investigate
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chat.greetingMessage.message.chat = undefined;
      await ctx.telegram.sendCopy(chat.id, chat.greetingMessage.message, {
        ...Extra.notifications(!ctx.dbchat.silentMessages),
        entities: chat.greetingMessage.message.entities,
      });
    }
    await clarifyReply(ctx);
  });
  // Setup checker
  bot.use(
    async (ctx: Context, next: () => void): Promise<boolean | undefined> => {
      try {
        // Check if needs to check
        if (!ctx.dbchat.greetsUsers) {
          return;
        }
        // Check if text
        if (!ctx.message || !ctx.message.text) {
          return false;
        }
        if (!isReplyToShieldy({ctx, bot})) {
          return;
        }
        // Check if reply to the correct message
        const greetingMessages = Object.keys(localizations.greetsUsers_true)
          .map((k) => localizations.greetsUsers_true[k])
          .concat(
            Object.keys(localizations.greetsUsers_true_message).map(
              (k) => localizations.greetsUsers_true_message[k],
            ),
          );
        if (
          !getReplyToMessageText(ctx) ||
          greetingMessages.indexOf(getReplyToMessageText(ctx)) < 0
        ) {
          return;
        }
        // Save text
        ctx.dbchat.greetingMessage = {
          message: ctx.message,
        };
        await ctx.appContext.database.setChatProperty({
          chatId: ctx.dbchat.id,
          property: 'greetingMessage',
          value: ctx.dbchat.greetingMessage,
        });
        ctx.reply(
          ctx.translate('greetsUsers_message_accepted'),
          Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage,
        );
      } catch (err) {
        ctx.appContext.report(err);
      } finally {
        next();
      }
    },
  );
}
