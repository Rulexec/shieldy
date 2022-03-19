import {botKickChatMember} from '@helpers/newcomers/kickChatMember';
import {Context} from '@root/types/index';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';

export const allowInvitingBotsCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {database, telegramApi},
    dbchat: chat,
    translate,
    message,
  } = ctx;

  chat.allowInvitingBots = !chat.allowInvitingBots;
  await database.setChatProperty({
    chatId: chat.id,
    property: 'allowInvitingBots',
    value: chat.allowInvitingBots,
  });

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: ctx.dbchat.silentMessages,
    text: translate(
      chat.allowInvitingBots
        ? T_`allowInvitingBots_true`
        : T_`allowInvitingBots_false`,
    ),
  });

  return BotMiddlewareNextStrategy.abort;
};

export function checkAllowInvitingBots(
  ctx: Context,
): BotMiddlewareNextStrategy {
  // Kick bots if required
  if (
    !!ctx.message?.new_chat_members?.length &&
    !ctx.dbchat.allowInvitingBots
  ) {
    const botName = ctx.appContext.telegrafBot?.botInfo?.username;

    ctx.message.new_chat_members
      .filter((m) => m.is_bot && m.username !== botName)
      .forEach((m) => {
        botKickChatMember(ctx.appContext, ctx.dbchat, m);
      });
  }

  return BotMiddlewareNextStrategy.next;
}
