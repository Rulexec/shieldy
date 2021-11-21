import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export function setupSilent(appContext: AppContext): void {
  const {addBotCommand, database, idling} = appContext;

  addBotCommand('silent', async (ctx) => {
    const {dbchat: chat, message, translate} = ctx;
    assertNonNullish(message);

    const isSilent = !chat.silentMessages;
    chat.silentMessages = isSilent;

    await database.setChatProperty({
      chatId: chat.id,
      property: 'silentMessages',
      value: isSilent,
    });

    idling.wrapTask(() =>
      ctx.replyWithMarkdown(
        translate(isSilent ? 'silentMessages_true' : 'silentMessages_false'),
        Extra.inReplyTo(message.message_id).notifications(!isSilent),
      ),
    );

    return BotMiddlewareNextStrategy.abort;
  });
}
