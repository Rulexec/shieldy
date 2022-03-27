import {Context} from '@sesuritu/types/src';

export enum BotMiddlewareNextStrategy {
  // Bot should continue applying middlewares
  next = 'next',
  // Bot should abort processing of this request
  abort = 'abort',
  // Middleware promises that will call `next()` later
  async = 'async',
}

/** @deprecated convert to `BotMiddlewareFn` */
export type OldBotMiddlewareFn = (
  ctx: Context,
  next: () => void,
) => void | Promise<void>;

export const newBotMiddlewareAdapter = (
  fn: BotMiddlewareFn,
): OldBotMiddlewareFn => {
  return async (ctx, next) => {
    const result = await fn(ctx, {next});

    switch (result) {
      case BotMiddlewareNextStrategy.next:
        next();
        break;
      case BotMiddlewareNextStrategy.abort:
      case BotMiddlewareNextStrategy.async:
        break;
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const never: never = result;
        break;
      }
    }
  };
};

export type BotMiddlewareFn = (
  ctx: Context,
  options: {next: () => void},
) => BotMiddlewareNextStrategy | Promise<BotMiddlewareNextStrategy>;
