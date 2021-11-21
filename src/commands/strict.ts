import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupStrict(bot: Bot): void {
  bot.command('strict', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const chat = ctx.dbchat;
    chat.strict = !chat.strict;
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'strict',
      value: chat.strict,
    });

    assertNonNullish(ctx.message);

    ctx.replyWithMarkdown(
      ctx.translate(chat.strict ? 'strict_true' : 'strict_false'),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !chat.silentMessages,
      ),
    );
  });
}
