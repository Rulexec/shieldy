import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

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
        chat.adminLocked ? T_`lock_true_shieldy` : T_`lock_false_shieldy`,
      ),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !chat.silentMessages,
      ),
    );
  });
}
