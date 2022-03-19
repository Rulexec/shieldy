import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const noAttackCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.noAttack = !chat.noAttack;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'noAttack',
    value: chat.noAttack,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      ctx.dbchat.noAttack ? T_`noAttack_true` : T_`noAttack_false`,
    ),
  });
});
