import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const skipOldUsersCommand = commandHandler(async (ctx) => {
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
      chat.skipOldUsers ? T_`skipOldUsers_true` : T_`skipOldUsers_false`,
    ),
    Extra.inReplyTo(ctx.message.message_id).notifications(!chat.silentMessages),
  );
});
