import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const skipVerifiedUsersCommand = commandHandler(async (ctx) => {
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
        ? T_`skipVerifiedUsers_true`
        : T_`skipVerifiedUsers_false`,
    ),
    Extra.inReplyTo(ctx.message.message_id).notifications(!chat.silentMessages),
  );
});
