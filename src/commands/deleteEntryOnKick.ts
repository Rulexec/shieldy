import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

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
            ? T_`deleteEntryOnKick_true`
            : T_`deleteEntryOnKick_false`,
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !ctx.dbchat.silentMessages,
        ),
      );
    },
  );
}
