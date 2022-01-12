import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot, Context} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {clarifyReply} from '@helpers/clarifyReply';
import {isReplyToShieldy} from '@helpers/isReplyToShieldy';
import {getReplyToMessageText} from '@root/types/hacks/get-message-text';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

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
            ? T_`greetsUsers_true_message`
            : T_`greetsUsers_true`
          : T_`greetsUsers_false`,
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
      const {
        appContext: {
          translations: {getLanguagesList, translate},
        },
      } = ctx;

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
        // FIXME: migrate to `lastReplySetting`/whatever, do not check by text
        const greetingMessages = getLanguagesList()
          .map((lang) => translate(lang, T_`greetsUsers_true`))
          .concat(
            getLanguagesList().map((lang) =>
              translate(lang, T_`greetsUsers_true_message`),
            ),
          );
        const messageReplyText = getReplyToMessageText(ctx);
        if (
          !messageReplyText ||
          greetingMessages.indexOf(messageReplyText) < 0
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
          ctx.translate(T_`greetsUsers_message_accepted`),
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
