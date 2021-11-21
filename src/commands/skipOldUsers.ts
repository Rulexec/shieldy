import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupSkipOldUsers(bot: Bot): void {
  bot.command(
    'skipOldUsers',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      const chat = ctx.dbchat;
      chat.skipOldUsers = !chat.skipOldUsers;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'skipOldUsers',
        value: chat.skipOldUsers,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          chat.skipOldUsers ? 'skipOldUsers_true' : 'skipOldUsers_false',
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !chat.silentMessages,
        ),
      );
    },
  );
}
