import {BotMiddlewareNextStrategy} from '@root/bot/types';
import {findChatById} from '@root/helpers/find-chat';
import {strings} from '@root/helpers/strings';
import {Context} from '@root/types/context';
import {getMessageText} from '@root/types/hacks/get-message-text';

export async function attachUser(
  ctx: Context,
): Promise<BotMiddlewareNextStrategy> {
  if (ctx.update.message?.date && getMessageText(ctx) === '/help') {
    ctx.appContext.logger.trace('Got to attachUser on help', {
      ms:
        ctx.appContext.getCurrentDate().getTime() / 1000 -
        ctx.update.message?.date,
    });
  }
  // Just drop the update if there is no chat
  if (!ctx.chat) {
    return BotMiddlewareNextStrategy.abort;
  }
  const chat = await findChatById(ctx.appContext, ctx.chat.id);
  if (ctx.update.message?.date && getMessageText(ctx) === '/help') {
    ctx.appContext.logger.trace('Got to attachUser on help, found user', {
      ms:
        ctx.appContext.getCurrentDate().getTime() / 1000 -
        ctx.update.message?.date,
    });
  }
  ctx.dbchat = chat;
  ctx.translate = (key) => {
    return strings(ctx.appContext, chat.language, key);
  };

  return BotMiddlewareNextStrategy.next;
}
