import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const banNewTelegramUsersCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {idling, database},
    dbchat: chat,
    message,
  } = ctx;

  chat.banNewTelegramUsers = !chat.banNewTelegramUsers;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'banNewTelegramUsers',
    value: chat.banNewTelegramUsers,
  });

  assertNonNullish(message);

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      ctx.translate(
        chat.banNewTelegramUsers
          ? T_`banNewTelegramUsers_true`
          : T_`banNewTelegramUsers_false`,
      ),
      Extra.inReplyTo(message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    ),
  );

  return BotMiddlewareNextStrategy.abort;
};
