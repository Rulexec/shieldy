import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const deleteEntryOnKickCommand: BotMiddlewareFn = async (ctx) => {
  const {
    message,
    dbchat: chat,
    appContext: {database, idling},
  } = ctx;

  chat.deleteEntryOnKick = !chat.deleteEntryOnKick;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'deleteEntryOnKick',
    value: chat.deleteEntryOnKick,
  });

  assertNonNullish(message);

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      ctx.translate(
        chat.deleteEntryOnKick
          ? T_`deleteEntryOnKick_true`
          : T_`deleteEntryOnKick_false`,
      ),
      Extra.inReplyTo(message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    ),
  );

  return BotMiddlewareNextStrategy.abort;
};
