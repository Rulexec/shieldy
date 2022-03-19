import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const casCommand: BotMiddlewareFn = async (ctx) => {
  const {
    message,
    dbchat: chat,
    appContext: {database, telegramApi},
  } = ctx;

  chat.cas = !chat.cas;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'cas',
    value: chat.cas,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(chat.cas ? T_`cas_true` : T_`cas_false`),
  });

  return BotMiddlewareNextStrategy.abort;
};
