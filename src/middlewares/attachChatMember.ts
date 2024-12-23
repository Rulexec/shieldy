import {isGroup} from '@helpers/isGroup';
import {BotMiddlewareNextStrategy} from '@root/bot/types';
import {Context} from '@root/types/context';
import {getMessageText} from '@root/types/hacks/get-message-text';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {logTelegramApiCall} from '@root/util/stats/telegram-calls';

export async function attachChatMember(
  ctx: Context,
): Promise<BotMiddlewareNextStrategy> {
  if (ctx.update.message?.date && getMessageText(ctx) === '/help') {
    ctx.appContext.logger.trace('Got to attachChatMember on help', {
      ms:
        ctx.appContext.getCurrentDate().getTime() / 1000 -
        ctx.update.message?.date,
    });
  }
  // If not a group, no need to get the member
  if (!isGroup(ctx)) {
    ctx.isAdministrator = true;
    return BotMiddlewareNextStrategy.next;
  }
  try {
    assertNonNullish(ctx.from);

    const chatMemberFromTelegram = await logTelegramApiCall(
      ctx.getChatMember(ctx.from.id),
      {
        name: 'getChatMember',
        place: 'attachChatMember',
        rootLogger: ctx.appContext.logger,
      },
    );
    ctx.isAdministrator = ['creator', 'administrator'].includes(
      chatMemberFromTelegram.status,
    );
  } catch (err) {
    // If anything above fails, just assume it's not an admin
    ctx.isAdministrator = false;
    ctx.appContext.report(err);
  }

  return BotMiddlewareNextStrategy.next;
}
