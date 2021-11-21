import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupSkipVerifiedUsers(bot: Bot): void {
  bot.command(
    'skipVerifiedUsers',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      const chat = ctx.dbchat;
      chat.skipVerifiedUsers = !chat.skipVerifiedUsers;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'skipVerifiedUsers',
        value: chat.skipVerifiedUsers,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          chat.skipVerifiedUsers
            ? 'skipVerifiedUsers_true'
            : 'skipVerifiedUsers_false',
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !chat.silentMessages,
        ),
      );
    },
  );
}
