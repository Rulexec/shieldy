import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export function setupPing(appContext: AppContext): void {
  const {addBotCommand, idling} = appContext;

  addBotCommand('ping', (ctx) => {
    const {dbchat, message} = ctx;
    assertNonNullish(message);

    idling.wrapTask(() =>
      ctx.replyWithMarkdown(
        'pong',
        Extra.inReplyTo(message.message_id).notifications(
          !dbchat.silentMessages,
        ),
      ),
    );

    return BotMiddlewareNextStrategy.abort;
  });
}
