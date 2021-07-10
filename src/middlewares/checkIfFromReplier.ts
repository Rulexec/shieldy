import {
  BotMiddlewareFn,
  BotMiddlewareNextStrategy,
  newBotMiddlewareAdapter,
} from '@root/bot/types';
import {Context} from '@root/types/context';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export const checkIfFromReplierMiddleware: BotMiddlewareFn = async (
  ctx: Context,
) => {
  if (
    ctx.callbackQuery &&
    ctx.callbackQuery.message &&
    ctx.callbackQuery.message.reply_to_message
  ) {
    const message = ctx.callbackQuery.message;
    // Anonymous admin
    if (
      message.reply_to_message &&
      message.reply_to_message.from &&
      message.reply_to_message.from.username &&
      message.reply_to_message.from.username === 'GroupAnonymousBot'
    ) {
      return BotMiddlewareNextStrategy.next;
    }

    assertNonNullish(message.reply_to_message?.from);

    if (ctx.callbackQuery.from.id !== message.reply_to_message.from.id) {
      try {
        await ctx.answerCbQuery(ctx.translate('only_author_can_reply'));
      } catch {
        // Do nothing
      }

      return BotMiddlewareNextStrategy.abort;
    }
  }

  return BotMiddlewareNextStrategy.next;
};

export const checkIfFromReplier = newBotMiddlewareAdapter(
  checkIfFromReplierMiddleware,
);
