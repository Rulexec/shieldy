import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const checAdminMiddleware: BotMiddlewareFn = (ctx) => {
  if (!ctx.isAdministrator) {
    return BotMiddlewareNextStrategy.abort;
  }

  return BotMiddlewareNextStrategy.next;
};
