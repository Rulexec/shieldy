import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const casCommand: BotMiddlewareFn = async (ctx) => {
  const {
    message,
    dbchat: chat,
    appContext: {database, idling},
  } = ctx;

  chat.cas = !chat.cas;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'cas',
    value: chat.cas,
  });

  assertNonNullish(message);

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      ctx.translate(chat.cas ? T_`cas_true` : T_`cas_false`),
      Extra.inReplyTo(message.message_id).notifications(!chat.silentMessages),
    ),
  );

  return BotMiddlewareNextStrategy.abort;
};
