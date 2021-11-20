import {Context} from '@root/types';
import {Defer} from '@root/util/async/defer';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from './types';

export const executeMiddlewares = async ({
  ctx,
  middlewares,
}: {
  ctx: Context;
  middlewares: BotMiddlewareFn[];
}): Promise<
  Exclude<BotMiddlewareNextStrategy, BotMiddlewareNextStrategy.async>
> => {
  for (const middleware of middlewares) {
    const defer = new Defer<
      Exclude<BotMiddlewareNextStrategy, BotMiddlewareNextStrategy.async>
    >();

    const result = await Promise.resolve().then(() =>
      middleware(ctx, {
        next: () => {
          defer.resolve(BotMiddlewareNextStrategy.next);
        },
      }),
    );

    switch (result) {
      case BotMiddlewareNextStrategy.next:
        continue;
      case BotMiddlewareNextStrategy.abort:
        // stop processing anymore
        return BotMiddlewareNextStrategy.abort;
      case BotMiddlewareNextStrategy.async: {
        const result = await defer.promise;

        switch (result) {
          case BotMiddlewareNextStrategy.next:
            break;
          case BotMiddlewareNextStrategy.abort:
            // stop processing anymore
            return BotMiddlewareNextStrategy.abort;
          default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const never: never = result;
            break;
          }
        }
        break;
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const never: never = result;
        break;
      }
    }
  }

  return BotMiddlewareNextStrategy.next;
};
