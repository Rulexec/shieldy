import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const strictCommand = commandHandler(async (ctx) => {
  const chat = ctx.dbchat;
  chat.strict = !chat.strict;
  await ctx.appContext.database.setChatProperty({
    chatId: chat.id,
    property: 'strict',
    value: chat.strict,
  });

  assertNonNullish(ctx.message);

  ctx.replyWithMarkdown(
    ctx.translate(chat.strict ? T_`strict_true` : T_`strict_false`),
    Extra.inReplyTo(ctx.message.message_id).notifications(!chat.silentMessages),
  );
});
