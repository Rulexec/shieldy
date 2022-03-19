import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const silentCommand = commandHandler(async (ctx) => {
  const {
    dbchat: chat,
    message,
    translate,
    appContext: {database, telegramApi},
  } = ctx;
  assertNonNullish(message);

  const isSilent = !chat.silentMessages;
  chat.silentMessages = isSilent;

  await database.setChatProperty({
    chatId: chat.id,
    property: 'silentMessages',
    value: isSilent,
  });

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: translate(
      isSilent ? T_`silentMessages_true` : T_`silentMessages_false`,
    ),
  });
});
