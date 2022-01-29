import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const banUsersCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {idling, database},
    dbchat: chat,
    message,
  } = ctx;

  chat.banUsers = !chat.banUsers;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'banUsers',
    value: chat.banUsers,
  });

  assertNonNullish(message);

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      ctx.translate(chat.banUsers ? T_`banUsers_true` : T_`banUsers_false`),
      Extra.inReplyTo(message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    ),
  );

  return BotMiddlewareNextStrategy.abort;
};
