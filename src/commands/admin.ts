import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const sourceCommandHandler: BotMiddlewareFn = async (ctx) => {
  if (!ctx || !ctx.message || !ctx.message.reply_to_message) {
    return BotMiddlewareNextStrategy.abort;
  }

  await ctx.replyWithHTML(
    `<code>${JSON.stringify(
      ctx.message.reply_to_message,
      undefined,
      2,
    )}</code>`,
  );
  await ctx.deleteMessage();

  return BotMiddlewareNextStrategy.abort;
};
