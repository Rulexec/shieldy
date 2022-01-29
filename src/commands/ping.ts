import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const pingCommand: BotMiddlewareFn = (ctx) => {
  const {
    dbchat,
    message,
    appContext: {idling},
  } = ctx;
  assertNonNullish(message);

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      'pong',
      Extra.inReplyTo(message.message_id).notifications(!dbchat.silentMessages),
    ),
  );

  return Promise.resolve(BotMiddlewareNextStrategy.abort);
};
