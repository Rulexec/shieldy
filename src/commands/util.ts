import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const commandHandler = (
  fun: (...params: Parameters<BotMiddlewareFn>) => Promise<void>,
): BotMiddlewareFn => {
  return (ctx, options) => {
    return fun(ctx, options).then(() => BotMiddlewareNextStrategy.abort);
  };
};
