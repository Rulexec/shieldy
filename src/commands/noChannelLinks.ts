import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {commandHandler} from './util';

export const noChannelLinksCommand = commandHandler(async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  chat.noChannelLinks = !chat.noChannelLinks;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'noChannelLinks',
    value: chat.noChannelLinks,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(
      chat.noChannelLinks ? T_`noChannelLinks_true` : T_`noChannelLinks_false`,
    ),
  });
});
