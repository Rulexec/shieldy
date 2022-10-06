import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {deleteMessageSafe} from '@root/helpers/deleteMessageSafe';
import {T_} from '@root/i18n/l10n-key';
import {checkIfFromReplierMiddleware} from '@root/middlewares/checkIfFromReplier';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {wrapTelegrafContextWithIdling} from '@root/util/telegraf/idling-context-wrapper';
import {CallbackButton} from 'telegraf/typings/markup';
import {CommandDefSetupFn} from '../types';

export const removeCustomCaptchaCommand: BotMiddlewareFn = async (ctx) => {
  const {
    message,
    appContext: {telegramApi},
    dbchat: chat,
  } = ctx;

  assertNonNullish(message);

  if (!chat.customCaptchaVariants.length) {
    await telegramApi.sendMessage({
      chat_id: chat.id,
      text: ctx.translate(T_`removeCustomCaptcha_empty`),
      parse_mode: 'Markdown',
      reply_to_message_id: message.message_id,
      disable_notification: ctx.dbchat.silentMessages,
    });
    return BotMiddlewareNextStrategy.abort;
  }

  await telegramApi.sendMessage({
    chat_id: chat.id,
    text: ctx.translate(T_`removeCustomCaptcha_text`),
    parse_mode: 'Markdown',
    reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: chat.customCaptchaVariants.map(({id, question}) => {
        return [
          {
            text: question,
            callback_data: `removeCustomCaptcha:${id}`,
          },
        ];
      }),
    },
    disable_notification: ctx.dbchat.silentMessages,
  });

  return BotMiddlewareNextStrategy.abort;
};

export const setupRemoveCustomCaptcha: CommandDefSetupFn = ({appContext}) => {
  const {addBotCallbackQuery, database} = appContext;

  addBotCallbackQuery(
    /^removeCustomCaptcha:\d+$/,
    checkIfFromReplierMiddleware,
    wrapTelegrafContextWithIdling(async (ctx) => {
      const {dbchat, callbackQuery, telegram} = ctx;

      assertNonNullish(callbackQuery);

      const {message, data} = callbackQuery;

      const match = /^removeCustomCaptcha:(\d+)$/.exec(data);
      assertNonNullish(match);

      const [, variantIdStr] = match;
      const variantId = parseInt(variantIdStr, 10);

      const inlineKeyboard = message.reply_markup?.inline_keyboard;
      assertNonNullish(inlineKeyboard);

      // Remove captcha variant from database
      const pos = dbchat.customCaptchaVariants.findIndex(
        ({id}) => id === variantId,
      );
      if (pos >= 0) {
        dbchat.customCaptchaVariants.splice(pos, 1);
        await database.setChatProperty({
          chatId: dbchat.id,
          property: 'customCaptchaVariants',
          value: dbchat.customCaptchaVariants,
        });
      }

      // Remove variant from keyboard
      const newButtons = inlineKeyboard
        .map((arr) => arr[0])
        .filter((rawButton) => {
          const {callback_data} = rawButton as CallbackButton;

          return callback_data !== data;
        });

      if (newButtons.length) {
        await telegram.editMessageReplyMarkup(
          message.chat.id,
          message.message_id,
          undefined,
          {
            inline_keyboard: newButtons.map((button) => [button]),
          },
        );
      } else {
        await deleteMessageSafe(ctx);
      }

      return BotMiddlewareNextStrategy.abort;
    }),
  );
};
