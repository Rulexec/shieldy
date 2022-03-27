import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {commandHandler} from './util';

export const restrictCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.restrict = !chat.restrict;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'restrict',
    value: chat.restrict,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(chat.restrict ? T_`restrict_true` : T_`restrict_false`),
  });
});
