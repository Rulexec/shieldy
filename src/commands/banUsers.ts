import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupBanUsers(bot: Bot): void {
  bot.command('banUsers', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const chat = ctx.dbchat;
    chat.banUsers = !chat.banUsers;
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'banUsers',
      value: chat.banUsers,
    });

    assertNonNullish(ctx.message);

    ctx.replyWithMarkdown(
      ctx.translate(chat.banUsers ? 'banUsers_true' : 'banUsers_false'),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    );
  });
}
