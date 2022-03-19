import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const lockCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.adminLocked = !chat.adminLocked;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'adminLocked',
    value: chat.adminLocked,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      chat.adminLocked ? T_`lock_true_shieldy` : T_`lock_false_shieldy`,
    ),
  });
});
