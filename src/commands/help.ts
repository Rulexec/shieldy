import {Context} from '@root/types/index';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {Extra} from 'telegraf';
import {T_} from '@root/i18n/l10n-key';

export const helpCommand: BotMiddlewareFn = async (ctx) => {
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
    .replyWithMarkdown(
      ctx.translate(T_`helpShieldy`),
      Extra.webPreview(false).notifications(!ctx.dbchat.silentMessages),
    )
    .then(() => {
      //
    });
}

export function sendHelpSafe(ctx: Context): Promise<void> {
  try {
    return ctx
      .replyWithMarkdown(
        ctx.translate(T_`helpShieldy`),
        Extra.webPreview(false).notifications(!ctx.dbchat.silentMessages),
      )
      .then(() => {
        //
      });
  } catch {
    return Promise.resolve();
  }
}
