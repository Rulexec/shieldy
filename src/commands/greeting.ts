import {Extra} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {clarifyReply} from '@helpers/clarifyReply';
import {isReplyToShieldy} from '@helpers/isReplyToShieldy';
import {getReplyToMessageText} from '@sesuritu/types/src/hacks/get-message-text';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {commandHandler} from './util';
import {CommandDefSetupFn} from './types';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export const greetingCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.greetsUsers = !chat.greetsUsers;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'greetsUsers',
    value: chat.greetsUsers,
  });

  assertNonNullish(message);

  await telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      chat.greetsUsers
        ? chat.greetingMessage
          ? T_`greetsUsers_true_message`
          : T_`greetsUsers_true`
        : T_`greetsUsers_false`,
    ),
  });

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

export const setupGreeting: CommandDefSetupFn = ({
  appContext: {addBotMiddleware},
}) => {
  addBotMiddleware(async (ctx) => {
    const {
      appContext: {
        translations: {getLanguagesList, translate},
        telegrafBot: bot,
      },
    } = ctx;

    try {
      // Check if needs to check
      if (!ctx.dbchat.greetsUsers) {
        return BotMiddlewareNextStrategy.next;
      }
      // Check if text
      if (!ctx.message || !ctx.message.text) {
        return BotMiddlewareNextStrategy.next;
      }
      if (!isReplyToShieldy({ctx, bot})) {
        return BotMiddlewareNextStrategy.next;
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
      if (!messageReplyText || greetingMessages.indexOf(messageReplyText) < 0) {
        return BotMiddlewareNextStrategy.next;
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
    }

    return BotMiddlewareNextStrategy.next;
  });
};
