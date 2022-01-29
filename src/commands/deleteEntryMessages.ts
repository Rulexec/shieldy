import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const deleteEntryMessageCommand: BotMiddlewareFn = async (ctx) => {
  const {
    message,
    dbchat: chat,
    appContext: {database, idling},
  } = ctx;

  chat.deleteEntryMessages = !chat.deleteEntryMessages;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'deleteEntryMessages',
    value: chat.deleteEntryMessages,
  });

  assertNonNullish(message);

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      ctx.translate(
        chat.deleteEntryMessages
          ? T_`deleteEntryMessages_true`
          : T_`deleteEntryMessages_false`,
      ),
      Extra.inReplyTo(message.message_id).notifications(!chat.silentMessages),
    ),
  );

  return BotMiddlewareNextStrategy.abort;
};
