import {Extra} from 'telegraf';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const deleteGreetingTimeCommand = commandHandler(async (ctx) => {
  assertNonNullish(ctx.message);
  assertNonNullish(ctx.botInfo?.username);

  // Check if limit is set
  const limitNumber =
    +ctx.message.text.substr(19).trim() ||
    +ctx.message.text.substr(20 + ctx.botInfo.username.length).trim();
  if (!isNaN(limitNumber) && limitNumber > 0 && limitNumber < 100000) {
    ctx.dbchat.deleteGreetingTime = limitNumber;
    await ctx.appContext.database.setChatProperty({
      chatId: ctx.dbchat.id,
      property: 'deleteGreetingTime',
      value: ctx.dbchat.deleteGreetingTime,
    });
    ctx.reply(
      ctx.translate(T_`greetsUsers_message_accepted`),
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
      `${ctx.translate(T_`greetsUsers_message_accepted`)} 0`,
      Extra.inReplyTo(ctx.message.message_id) as ExtraReplyMessage,
    );
  }
});
