import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const noChannelLinksCommand = commandHandler(async (ctx) => {
  const chat = ctx.dbchat;
  chat.noChannelLinks = !chat.noChannelLinks;
  await ctx.appContext.database.setChatProperty({
    chatId: chat.id,
    property: 'noChannelLinks',
    value: chat.noChannelLinks,
  });

  assertNonNullish(ctx.message);

  ctx.replyWithMarkdown(
    ctx.translate(
      chat.noChannelLinks ? T_`noChannelLinks_true` : T_`noChannelLinks_false`,
    ),
    Extra.inReplyTo(ctx.message.message_id).notifications(!chat.silentMessages),
  );
});
