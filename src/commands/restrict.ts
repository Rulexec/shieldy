import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupRestrict(bot: Bot): void {
  bot.command('restrict', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const chat = ctx.dbchat;
    chat.restrict = !chat.restrict;
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'restrict',
      value: chat.restrict,
    });

    assertNonNullish(ctx.message);

    ctx.replyWithMarkdown(
      ctx.translate(chat.restrict ? 'restrict_true' : 'restrict_false'),
      Extra.inReplyTo(ctx.message.message_id),
    );
  });
}
