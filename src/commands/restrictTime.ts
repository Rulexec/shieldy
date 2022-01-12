import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

export function setupRestrictTime(bot: Bot): void {
  bot.command(
    'restrictTime',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      assertNonNullish(ctx.message);
      assertNonNullish(bot.botInfo?.username);

      // Check if limit is set
      const limitNumber =
        +ctx.message.text.substr('/restrictTime'.length).trim() ||
        +ctx.message.text
          .substr('/restrictTime@'.length + bot.botInfo.username.length)
          .trim();
      if (!isNaN(limitNumber) && limitNumber > 0 && limitNumber < 745) {
        // roughly 31 days
        ctx.dbchat.restrictTime = limitNumber;
        await ctx.appContext.database.setChatProperty({
          chatId: ctx.dbchat.id,
          property: 'restrictTime',
          value: ctx.dbchat.restrictTime,
        });
        ctx.reply(
          ctx.translate(T_`greetsUsers_message_accepted`),
          Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage,
        );
      } else {
        ctx.dbchat.restrictTime = 24;
        await ctx.appContext.database.setChatProperty({
          chatId: ctx.dbchat.id,
          property: 'restrictTime',
          value: ctx.dbchat.restrictTime,
        });
        ctx.reply(
          `${ctx.translate(T_`greetsUsers_message_accepted`)} 0`,
          Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage,
        );
      }
    },
  );
}
