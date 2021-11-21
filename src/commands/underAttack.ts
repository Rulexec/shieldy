import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {checkLock} from '@middlewares/checkLock';
import {Bot} from '@root/types/bot';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupUnderAttack(bot: Bot): void {
  bot.command(
    'underAttack',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      ctx.dbchat.underAttack = !ctx.dbchat.underAttack;
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'underAttack',
        value: ctx.dbchat.underAttack,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          ctx.dbchat.underAttack ? 'underAttack_true' : 'underAttack_false',
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !ctx.dbchat.silentMessages,
        ),
      );
    },
  );
}
