import {isGroup} from '@helpers/isGroup';
import {
  BotMiddlewareFn,
  BotMiddlewareNextStrategy,
  newBotMiddlewareAdapter,
} from '@root/bot/types';
import {botDeleteMessageSafe} from '@root/helpers/deleteMessageSafe';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';

export const checkLockMiddleware: BotMiddlewareFn = async (ctx) => {
  const {chat, message} = ctx;

  // If loccked, private messages or channel, then continue
  if (!ctx.dbchat.adminLocked || !isGroup(ctx)) {
    return BotMiddlewareNextStrategy.next;
  }

  assertNonNullish(ctx.from);

  // If super admin, then continue
  if (ctx.from.id === ctx.appContext.config.telegramAdminId) {
    return BotMiddlewareNextStrategy.next;
  }
  // If from admin, then continue
  if (ctx.isAdministrator) {
    return BotMiddlewareNextStrategy.next;
  }

  assertNonNullish(chat);
  assertNonNullish(message);

  // Otherwise, remove the message
  await ctx.appContext.idling.wrapTask(() =>
    botDeleteMessageSafe(ctx.appContext, {
      chatId: chat.id,
      messageId: message.message_id,
    }),
  );

  return BotMiddlewareNextStrategy.abort;
};

export const checkLock = newBotMiddlewareAdapter(checkLockMiddleware);
