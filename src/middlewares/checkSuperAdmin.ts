import {
  BotMiddlewareFn,
  BotMiddlewareNextStrategy,
  newBotMiddlewareAdapter,
} from '@root/bot/types';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export const checkSuperAdminMiddleware: BotMiddlewareFn = (ctx) => {
  assertNonNullish(ctx.from);

  if (ctx.from.id !== ctx.appContext.config.telegramAdminId) {
    return BotMiddlewareNextStrategy.abort;
  }

  return BotMiddlewareNextStrategy.next;
};

export const checkSuperAdmin = newBotMiddlewareAdapter(
  checkSuperAdminMiddleware,
);
