import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupDeleteEntryMessages(bot: Bot): void {
  bot.command(
    'deleteEntryMessages',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      const chat = ctx.dbchat;
      chat.deleteEntryMessages = !chat.deleteEntryMessages;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'deleteEntryMessages',
        value: chat.deleteEntryMessages,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          chat.deleteEntryMessages
            ? 'deleteEntryMessages_true'
            : 'deleteEntryMessages_false',
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !ctx.dbchat.silentMessages,
        ),
      );
    },
  );
}
