import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';

export const removeAllCustomCaptchaCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {telegramApi},
    dbchat: chat,
  } = ctx;

  chat.customCaptchaVariants = [];
  await ctx.appContext.database.setChatProperty({
    chatId: chat.id,
    property: 'customCaptchaVariants',
    value: chat.customCaptchaVariants,
  });

  await telegramApi.sendMessage({
    chat_id: chat.id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(T_`custom_removed`),
  });

  return BotMiddlewareNextStrategy.abort;
};
