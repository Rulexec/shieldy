import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupDeleteGreetingTime(bot: Bot): void {
  bot.command(
    'deleteGreetingTime',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      assertNonNullish(ctx.message);
      assertNonNullish(bot.botInfo?.username);

      // Check if limit is set
      const limitNumber =
        +ctx.message.text.substr(19).trim() ||
        +ctx.message.text.substr(20 + bot.botInfo.username.length).trim();
      if (!isNaN(limitNumber) && limitNumber > 0 && limitNumber < 100000) {
        ctx.dbchat.deleteGreetingTime = limitNumber;
        await ctx.appContext.database.setChatProperty({
          chatId: ctx.dbchat.id,
          property: 'deleteGreetingTime',
          value: ctx.dbchat.deleteGreetingTime,
        });
        ctx.reply(
          ctx.translate('greetsUsers_message_accepted'),
          Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage,
        );
      } else {
        ctx.dbchat.deleteGreetingTime = undefined;
        await ctx.appContext.database.setChatProperty({
          chatId: ctx.dbchat.id,
          property: 'deleteGreetingTime',
          value: ctx.dbchat.deleteGreetingTime,
        });
        ctx.reply(
          `${ctx.translate('greetsUsers_message_accepted')} 0`,
          Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage,
        );
      }
    },
  );
}
