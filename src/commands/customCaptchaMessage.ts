import {clarifyReply} from '@helpers/clarifyReply';
import {Extra} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {getReplyToMessageText} from '@root/types/hacks/get-message-text';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';
import {CommandDefSetupFn} from './types';

export const customCaptchaMessageCommand: BotMiddlewareFn = async (ctx) => {
  const chat = ctx.dbchat;
  chat.customCaptchaMessage = !chat.customCaptchaMessage;
  await ctx.appContext.database.setChatProperty({
    chatId: chat.id,
    property: 'customCaptchaMessage',
    value: chat.customCaptchaMessage,
  });

  assertNonNullish(ctx.message);

  await ctx.replyWithMarkdown(
    ctx.translate(
      chat.customCaptchaMessage
        ? chat.captchaMessage
          ? T_`captchaMessage_true_message`
          : T_`captchaMessage_true`
        : T_`captchaMessage_false`,
    ),
    Extra.inReplyTo(ctx.message.message_id).notifications(
      !ctx.dbchat.silentMessages,
    ),
  );

  if (chat.customCaptchaMessage && chat.captchaMessage) {
    // TODO: investigate
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chat.captchaMessage.message.chat = undefined;
    await ctx.telegram.sendCopy(chat.id, chat.captchaMessage.message, {
      ...Extra.notifications(!ctx.dbchat.silentMessages),
      entities: chat.captchaMessage.message.entities,
    });
  }
  await clarifyReply(ctx);

  return BotMiddlewareNextStrategy.abort;
};

export const setupCustomCaptchaMessage: CommandDefSetupFn = ({appContext}) => {
  const {addBotMiddleware, telegrafBot, idling} = appContext;

  // Setup checker
  addBotMiddleware(async (ctx, {next}) => {
    const {
      appContext: {
        translations: {getLanguagesList, translate},
      },
    } = ctx;

    try {
      // Check if needs to check
      if (!ctx.dbchat.customCaptchaMessage) {
        return BotMiddlewareNextStrategy.async;
      }

      const {message} = ctx;

      // Check if reply
      if (!message || !message.reply_to_message) {
        return BotMiddlewareNextStrategy.async;
      }
      // Check if text
      if (!message.text) {
        return BotMiddlewareNextStrategy.async;
      }
      // Check if reply to shieldy
      if (
        !telegrafBot.botInfo ||
        !message.reply_to_message.from ||
        message.reply_to_message.from.id !== telegrafBot.botInfo.id
      ) {
        return BotMiddlewareNextStrategy.async;
      }
      // Check if reply to the correct message
      // FIXME: migrate to `lastReplySetting`/whatever, do not check by text
      const captchaMessages = getLanguagesList()
        .map((lang) => translate(lang, T_`captchaMessage_true`))
        .concat(
          getLanguagesList().map((lang) =>
            translate(lang, T_`captchaMessage_true_message`),
          ),
        );
      const messageReplyText = getReplyToMessageText(ctx);
      if (!messageReplyText || captchaMessages.indexOf(messageReplyText) < 0) {
        return BotMiddlewareNextStrategy.async;
      }
      // Save text
      ctx.dbchat.captchaMessage = {
        message,
      };
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'captchaMessage',
        value: ctx.dbchat.captchaMessage,
      });

      idling.wrapTask(() =>
        ctx.reply(
          ctx.translate(T_`greetsUsers_message_accepted`),
          Extra.inReplyTo(message.message_id) as ExtraReplyMessage,
        ),
      );
    } catch (err) {
      ctx.appContext.report(err);
    } finally {
      next();
    }

    return BotMiddlewareNextStrategy.async;
  });
};
