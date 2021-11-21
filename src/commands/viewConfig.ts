import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Chat} from '@models/Chat';
import {Extra} from 'telegraf';
import {checkLock} from '@middlewares/checkLock';
import {Bot} from '@root/types/bot';
import {Context} from '@root/types/context';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupViewConfig(bot: Bot): void {
  bot.command(
    'viewConfig',
    checkLock,
    clarifyIfPrivateMessages,
    async (ctx) => {
      assertNonNullish(ctx.message);

      const secondPart = ctx.message.text.split(' ')[1];
      if (secondPart) {
        try {
          let chatId: number | undefined;
          if (!isNaN(+secondPart)) {
            chatId = +secondPart;
          } else if (secondPart.startsWith('@')) {
            const telegramChat = await ctx.telegram.getChat(secondPart);
            chatId = telegramChat.id;
          }
          if (chatId) {
            const chat = await ctx.appContext.database.getChatById(chatId);
            assertNonNullish(chat);
            return sendCurrentConfig(ctx, chat);
          }
        } catch (err) {
          return ctx.reply(ctx.translate('noChatFound'));
        }
      }
      await sendCurrentConfig(ctx, ctx.dbchat);
    },
  );
}

export async function sendCurrentConfig(
  ctx: Context,
  chat: Chat,
): Promise<void> {
  assertNonNullish(ctx.chat);
  assertNonNullish(ctx.message);

  await ctx.replyWithMarkdown(
    `${ctx.translate('viewConfig')}

id: <code>${chat.id}</code>
type: <code>${ctx.chat.type}</code>
botRole: <code>${
      ctx.chat.type === 'private'
        ? 'N/A'
        : (
            await ctx.getChatMember((await ctx.telegram.getMe()).id)
          ).status
    }</code>
language: <code>${chat.language}</code>
captchaType: <code>${chat.captchaType}</code>
timeGivenSec: <code>${chat.timeGiven}</code>
adminLocked: <code>${chat.adminLocked}</code>
restrict: <code>${chat.restrict}</code>
noChannelLinks: <code>${chat.noChannelLinks}</code>
deleteEntryMessages: <code>${chat.deleteEntryMessages}</code>
greetsUsers: <code>${chat.greetsUsers}</code>
customCaptchaMessage: <code>${chat.customCaptchaMessage}</code>
strict: <code>${chat.strict}</code>
deleteGreetingTime: <code>${chat.deleteGreetingTime || 0}</code>
banUsers: <code>${chat.banUsers}</code>
deleteEntryOnKick: <code>${chat.deleteEntryOnKick}</code>
cas: <code>${chat.cas}</code>
underAttack: <code>${chat.underAttack}</code>
noAttack: <code>${chat.noAttack}</code>
buttonText: <code>${chat.buttonText || 'Not set'}</code>
allowInvitingBots: <code>${chat.allowInvitingBots}</code>
skipOldUsers: <code>${chat.skipOldUsers}</code>
skipVerifiedUsers: <code>${chat.skipVerifiedUsers}</code>
restrictTimeHours: <code>${chat.restrictTime || 24}</code>
banNewTelegramUsers: <code>${chat.banNewTelegramUsers}</code>
silent: <code>${Boolean(chat.silentMessages)}</code>
greetingButtons:
<code>${chat.greetingButtons || 'Not set'}</code>`,
    Extra.inReplyTo(ctx.message.message_id)
      .HTML(true)
      .notifications(!chat.silentMessages),
  );
  if (chat.greetingMessage) {
    // TODO: investigate
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chat.greetingMessage.message.chat = undefined;
    await ctx.telegram.sendCopy(ctx.dbchat.id, chat.greetingMessage.message, {
      ...Extra.webPreview(false)
        .inReplyTo(ctx.message.message_id)
        .notifications(!ctx.dbchat.silentMessages),
      entities: chat.greetingMessage.message.entities,
    });
  }
  if (chat.captchaMessage) {
    // TODO: investigate
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chat.captchaMessage.message.chat = undefined;
    await ctx.telegram.sendCopy(ctx.dbchat.id, chat.captchaMessage.message, {
      ...Extra.webPreview(false)
        .inReplyTo(ctx.message.message_id)
        .notifications(!ctx.dbchat.silentMessages),
      entities: chat.captchaMessage.message.entities,
    });
  }
}
