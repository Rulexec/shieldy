import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupCAS(bot: Bot): void {
  bot.command('cas', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const chat = ctx.dbchat;
    chat.cas = !chat.cas;
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'cas',
      value: chat.cas,
    });

    assertNonNullish(ctx.message);

    ctx.replyWithMarkdown(
      ctx.translate(chat.cas ? 'cas_true' : 'cas_false'),
      Extra.inReplyTo(ctx.message.message_id),
    );
  });
}
