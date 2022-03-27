import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const banNewTelegramUsersCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.banNewTelegramUsers = !chat.banNewTelegramUsers;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'banNewTelegramUsers',
    value: chat.banNewTelegramUsers,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: ctx.dbchat.silentMessages,
    text: ctx.translate(
      chat.banNewTelegramUsers
        ? T_`banNewTelegramUsers_true`
        : T_`banNewTelegramUsers_false`,
    ),
  });

  return BotMiddlewareNextStrategy.abort;
};
