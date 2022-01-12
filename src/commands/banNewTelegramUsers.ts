import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

export function setupBanNewTelegramUsers(bot: Bot): void {
  bot.command(
    'banNewTelegramUsers',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      const chat = ctx.dbchat;
      chat.banNewTelegramUsers = !chat.banNewTelegramUsers;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'banNewTelegramUsers',
        value: chat.banNewTelegramUsers,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        ctx.translate(
          chat.banNewTelegramUsers
            ? T_`banNewTelegramUsers_true`
            : T_`banNewTelegramUsers_false`,
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !ctx.dbchat.silentMessages,
        ),
      );
    },
  );
}
