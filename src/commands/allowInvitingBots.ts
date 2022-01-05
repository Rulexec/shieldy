import {botKickChatMember} from '@helpers/newcomers/kickChatMember';
import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot, Context} from '@root/types/index';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';

export function setupAllowInvitingBots(bot: Bot): void {
  bot.command(
    'allowInvitingBots',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx: Context) => {
      const {dbchat: chat, translate} = ctx;

      chat.allowInvitingBots = !chat.allowInvitingBots;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'allowInvitingBots',
        value: chat.allowInvitingBots,
      });

      assertNonNullish(ctx.message);

      ctx.replyWithMarkdown(
        translate(
          chat.allowInvitingBots
            ? T_`allowInvitingBots_true`
            : T_`allowInvitingBots_false`,
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !ctx.dbchat.silentMessages,
        ),
      );
    },
  );
}

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
