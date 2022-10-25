import {botKickChatMember} from '@helpers/newcomers/kickChatMember';
import {Context} from '@root/types/index';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';
import {KickReason} from '@root/types/telegram/kick-reason';

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

export async function checkAllowInvitingBots(
  ctx: Context,
): Promise<BotMiddlewareNextStrategy> {
  const {
    dbchat: {allowInvitingBots},
    appContext: {
      telegrafBot: {botInfo},
    },
  } = ctx;

  if (allowInvitingBots) {
    return BotMiddlewareNextStrategy.next;
  }

  const newChatMembers = ctx.message?.new_chat_members;
  if (!newChatMembers?.length) {
    return BotMiddlewareNextStrategy.next;
  }

  const selfName = botInfo?.username;
  const bots = newChatMembers.filter(
    (member) => member.is_bot && member.username !== selfName,
  );

  if (!bots.length) {
    return BotMiddlewareNextStrategy.next;
  }

  const adderId = ctx.message?.from?.id;
  if (adderId) {
    const adder = await ctx.getChatMember(adderId);
    if (['creator', 'administrator'].includes(adder.status)) {
      return BotMiddlewareNextStrategy.next;
    }
  }

  await Promise.all(
    bots.map((user) =>
      botKickChatMember({
        appContext: ctx.appContext,
        chat: ctx.dbchat,
        user,
        reason: KickReason.allowInvitingBots,
      }),
    ),
  );

  return BotMiddlewareNextStrategy.next;
}
