import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupDeleteEntryOnKick(bot: Bot): void {
  bot.command(
    'deleteEntryOnKick',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      const chat = ctx.dbchat;
      chat.deleteEntryOnKick = !chat.deleteEntryOnKick;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'deleteEntryOnKick',
        value: chat.deleteEntryOnKick,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          chat.deleteEntryOnKick
            ? 'deleteEntryOnKick_true'
            : 'deleteEntryOnKick_false',
        ),
        Extra.inReplyTo(ctx.message.message_id),
      );
    },
  );
}
