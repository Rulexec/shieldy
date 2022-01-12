import {
  BotMiddlewareFn,
  BotMiddlewareNextStrategy,
  newBotMiddlewareAdapter,
} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';

export const clarifyIfPrivateMessagesMiddleware: BotMiddlewareFn = async (
  ctx,
) => {
  if (ctx.chat?.type !== 'private') {
    return BotMiddlewareNextStrategy.next;
  }

  await ctx.appContext.idling.wrapTask(() =>
    ctx.reply(ctx.translate(T_`commandsInPrivateWarning`)),
  );

  return BotMiddlewareNextStrategy.next;
};

export const clarifyIfPrivateMessages = newBotMiddlewareAdapter(
  clarifyIfPrivateMessagesMiddleware,
);
