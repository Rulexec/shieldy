import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const checkAdminMiddleware: BotMiddlewareFn = (ctx) => {
  if (!ctx.isAdministrator) {
    return BotMiddlewareNextStrategy.abort;
  }

  return BotMiddlewareNextStrategy.next;
};
