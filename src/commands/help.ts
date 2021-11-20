import {Context} from '@root/types/index';
import {checkLockMiddleware} from '@middlewares/checkLock';
import {clarifyIfPrivateMessagesMiddleware} from '@helpers/clarifyIfPrivateMessages';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export function setupHelp(appContext: AppContext): void {
  const {addBotCommand} = appContext;

  addBotCommand(
    ['help', 'start'],
    checkLockMiddleware,
    clarifyIfPrivateMessagesMiddleware,
    sendHelpMiddleware,
  );
}

const sendHelpMiddleware: BotMiddlewareFn = async (ctx) => {
  await sendHelp(ctx);
  return BotMiddlewareNextStrategy.abort;
};

function sendHelp(ctx: Context): Promise<void> {
  if (ctx.update.message?.date) {
    ctx.appContext.logger.trace('Replying to help', {
      ms:
        ctx.appContext.getCurrentDate().getTime() / 1000 -
        ctx.update.message?.date,
    });
  }
  return ctx
    .replyWithMarkdown(ctx.translate('helpShieldy'), {
      disable_web_page_preview: true,
    })
    .then(() => {
      //
    });
}

export function sendHelpSafe(ctx: Context): Promise<void> {
  try {
    return ctx
      .replyWithMarkdown(ctx.translate('helpShieldy'), {
        disable_web_page_preview: true,
      })
      .then(() => {
        //
      });
  } catch {
    return Promise.resolve();
  }
}
