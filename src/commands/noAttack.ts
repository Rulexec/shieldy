import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

export function setupNoAttack(bot: Bot): void {
  bot.command('noAttack', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    ctx.dbchat.noAttack = !ctx.dbchat.noAttack;
    await ctx.appContext.database.setChatProperty({
      chatId: ctx.dbchat.id,
      property: 'noAttack',
      value: ctx.dbchat.noAttack,
    });

    assertNonNullish(ctx.message);

    ctx.replyWithMarkdown(
      ctx.translate(
        ctx.dbchat.noAttack ? T_`noAttack_true` : T_`noAttack_false`,
      ),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    );
  });
}
