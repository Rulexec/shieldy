import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {commandHandler} from './util';

export const skipOldUsersCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.skipOldUsers = !chat.skipOldUsers;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'skipOldUsers',
    value: chat.skipOldUsers,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      chat.skipOldUsers ? T_`skipOldUsers_true` : T_`skipOldUsers_false`,
    ),
  });
});
