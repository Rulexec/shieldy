import {botKickChatMember} from '@helpers/newcomers/kickChatMember';
import {Extra} from 'telegraf';
import {Context} from '@root/types/index';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';

export const allowInvitingBotsCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {idling, database},
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

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      translate(
        chat.allowInvitingBots
          ? T_`allowInvitingBots_true`
          : T_`allowInvitingBots_false`,
      ),
      Extra.inReplyTo(message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    ),
  );

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
