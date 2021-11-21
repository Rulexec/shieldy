import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupNoChannelLinks(bot: Bot): void {
  bot.command(
    'noChannelLinks',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      const chat = ctx.dbchat;
      chat.noChannelLinks = !chat.noChannelLinks;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'noChannelLinks',
        value: chat.noChannelLinks,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          chat.noChannelLinks ? 'noChannelLinks_true' : 'noChannelLinks_false',
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !chat.silentMessages,
        ),
      );
    },
  );
}
