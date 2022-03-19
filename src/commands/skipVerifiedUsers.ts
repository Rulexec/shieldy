import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const skipVerifiedUsersCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.skipVerifiedUsers = !chat.skipVerifiedUsers;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'skipVerifiedUsers',
    value: chat.skipVerifiedUsers,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      chat.skipVerifiedUsers
        ? T_`skipVerifiedUsers_true`
        : T_`skipVerifiedUsers_false`,
    ),
  });
});
