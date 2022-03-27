import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const pingCommand: BotMiddlewareFn = (ctx) => {
  const {
    dbchat,
    message,
    appContext: {telegramApi},
  } = ctx;
  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: dbchat.id,
    reply_to_message_id: message.message_id,
    disable_notification: dbchat.silentMessages,
    text: 'pong',
  });

  return Promise.resolve(BotMiddlewareNextStrategy.abort);
};
