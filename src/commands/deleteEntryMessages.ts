import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const deleteEntryMessageCommand: BotMiddlewareFn = async (ctx) => {
  const {
    message,
    dbchat: chat,
    appContext: {database, telegramApi},
  } = ctx;

  chat.deleteEntryMessages = !chat.deleteEntryMessages;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'deleteEntryMessages',
    value: chat.deleteEntryMessages,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      chat.deleteEntryMessages
        ? T_`deleteEntryMessages_true`
        : T_`deleteEntryMessages_false`,
    ),
  });

  return BotMiddlewareNextStrategy.abort;
};
