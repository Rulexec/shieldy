import {
  BotMiddlewareFn,
  BotMiddlewareNextStrategy,
  newBotMiddlewareAdapter,
} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';
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

    assertNonNullish(message.reply_to_message?.from);

    if (ctx.callbackQuery.from.id !== message.reply_to_message.from.id) {
      try {
        await ctx.answerCbQuery(ctx.translate(T_`only_author_can_reply`));
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
