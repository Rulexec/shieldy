import Telegraf from 'telegraf';
import {User} from 'telegraf/typings/telegram-types';
import {Context} from './context';

// FIXME: do not mutate not our objects
export type Bot = Telegraf<Context> & {
  botInfo?: User;
};

export enum BotMiddlewareNextStrategy {
  // Bot should continue applying middlewares
  next = 'next',
  // Bot should abort processing of this request
  abort = 'abort',
  // Middleware promises that will call `next()` later
  async = 'async',
}

export type BotMiddlewareFn = (
  ctx: Context,
  options: {next: () => void},
) => BotMiddlewareNextStrategy | Promise<BotMiddlewareNextStrategy>;
