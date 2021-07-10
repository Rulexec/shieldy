import {BotMiddlewareNextStrategy} from '@root/bot/types';
import {Context} from 'telegraf';

const blocklist = [-1001410821804];

export function checkBlockList(ctx: Context): BotMiddlewareNextStrategy {
  const chatId = ctx.chat?.id;

  if (chatId && blocklist.includes(chatId)) {
    return BotMiddlewareNextStrategy.abort;
  }

  return BotMiddlewareNextStrategy.next;
}
