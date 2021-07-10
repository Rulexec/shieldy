import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupButtonText(bot: Bot): void {
  bot.command(
    'buttonText',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      assertNonNullish(ctx.message);

      const text = ctx.message.text.substr(12);
      if (!text) {
        ctx.dbchat.buttonText = undefined;
      } else {
        ctx.dbchat.buttonText = text;
      }
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'buttonText',
        value: ctx.dbchat.buttonText,
      });
      await ctx.replyWithMarkdown(
        ctx.translate('trust_success'),
        Extra.inReplyTo(ctx.message.message_id),
      );
    },
  );
}
