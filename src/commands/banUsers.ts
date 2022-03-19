import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const banUsersCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.banUsers = !chat.banUsers;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'banUsers',
    value: chat.banUsers,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: ctx.dbchat.silentMessages,
    text: ctx.translate(chat.banUsers ? T_`banUsers_true` : T_`banUsers_false`),
  });

  return BotMiddlewareNextStrategy.abort;
};
