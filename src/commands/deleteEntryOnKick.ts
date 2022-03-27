import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const deleteEntryOnKickCommand: BotMiddlewareFn = async (ctx) => {
  const {
    message,
    dbchat: chat,
    appContext: {database, telegramApi},
  } = ctx;

  chat.deleteEntryOnKick = !chat.deleteEntryOnKick;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'deleteEntryOnKick',
    value: chat.deleteEntryOnKick,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      chat.deleteEntryOnKick
        ? T_`deleteEntryOnKick_true`
        : T_`deleteEntryOnKick_false`,
    ),
  });

  return BotMiddlewareNextStrategy.abort;
};
