import {
  BotMiddlewareFn,
  BotMiddlewareNextStrategy,
  newBotMiddlewareAdapter,
} from '@root/bot/types';

export const clarifyIfPrivateMessagesMiddleware: BotMiddlewareFn = async (
  ctx,
) => {
  if (ctx.chat?.type !== 'private') {
    return BotMiddlewareNextStrategy.next;
  }

  await ctx.appContext.idling.wrapTask(() =>
    ctx.reply(ctx.translate('commandsInPrivateWarning')),
  );

  return BotMiddlewareNextStrategy.next;
};

export const clarifyIfPrivateMessages = newBotMiddlewareAdapter(
  clarifyIfPrivateMessagesMiddleware,
);
