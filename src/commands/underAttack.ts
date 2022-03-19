import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const underAttackCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.underAttack = !chat.underAttack;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'underAttack',
    value: chat.underAttack,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      ctx.dbchat.underAttack ? T_`underAttack_true` : T_`underAttack_false`,
    ),
  });
});
