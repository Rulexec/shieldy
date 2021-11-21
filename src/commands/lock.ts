import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupLock(bot: Bot): void {
  bot.command('lock', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    const chat = ctx.dbchat;
    chat.adminLocked = !chat.adminLocked;
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'adminLocked',
      value: chat.adminLocked,
    });

    assertNonNullish(ctx.message);

    ctx.replyWithMarkdown(
      ctx.translate(
        chat.adminLocked ? 'lock_true_shieldy' : 'lock_false_shieldy',
      ),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !chat.silentMessages,
      ),
    );
  });
}
