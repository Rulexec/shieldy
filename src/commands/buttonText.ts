import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const buttonTextCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  assertNonNullish(message);

  const text = message.text.substr(12);
  if (!text) {
    chat.buttonText = undefined;
  } else {
    chat.buttonText = text;
  }
  await database.setChatProperty({
    chatId: chat.id,
    property: 'buttonText',
    value: chat.buttonText,
  });
  await telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(T_`trust_success`),
  });

  return BotMiddlewareNextStrategy.abort;
};
