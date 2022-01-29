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
  return replyWithHelp(ctx);
}

const replyWithHelp = (ctx: Context): Promise<void> => {
  const {
    appContext: {commandDefinitions},
  } = ctx;

  const commandsStr = commandDefinitions
    .map(({key, helpDescription}) => {
      if (!helpDescription) {
        return null;
      }

      return `/${key} — ${ctx.translate(helpDescription)}`;
    })
    .filter(Boolean)
    .join('\n');

  const result = `${ctx.translate(
    T_`help_start`,
  )}\n\n${commandsStr}\n\n${ctx.translate(T_`help_end`)}`;

  return ctx
    .replyWithMarkdown(
      result,
      Extra.webPreview(false).notifications(!ctx.dbchat.silentMessages),
    )
    .then(() => {
      //
    });
};

export function sendHelpSafe(ctx: Context): Promise<void> {
  try {
    return replyWithHelp(ctx);
  } catch {
    return Promise.resolve();
  }
}
