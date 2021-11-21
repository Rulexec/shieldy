import {clarifyReply} from '@helpers/clarifyReply';
import {clarifyIfPrivateMessagesMiddleware} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {localizations} from '@helpers/strings';
import {checkLockMiddleware} from '@middlewares/checkLock';
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {getReplyToMessageText} from '@root/types/hacks/get-message-text';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {wrapTelegrafContextWithIdling} from '@root/util/telegraf/idling-context-wrapper';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export function setupCaptchaMessage(appContext: AppContext): void {
  const {addBotCommand, addBotMiddleware, telegrafBot, idling} = appContext;

  // Setup command
  addBotCommand(
    'customCaptchaMessage',
    checkLockMiddleware,
    clarifyIfPrivateMessagesMiddleware,
    wrapTelegrafContextWithIdling(async (ctx) => {
      const chat = ctx.dbchat;
      chat.customCaptchaMessage = !chat.customCaptchaMessage;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'customCaptchaMessage',
        value: chat.customCaptchaMessage,
      });

      assertNonNullish(ctx.message);

      await ctx.replyWithMarkdown(
        ctx.translate(
          chat.customCaptchaMessage
            ? chat.captchaMessage
              ? 'captchaMessage_true_message'
              : 'captchaMessage_true'
            : 'captchaMessage_false',
        ),
        Extra.inReplyTo(ctx.message.message_id).notifications(
          !ctx.dbchat.silentMessages,
        ),
      );

      if (chat.customCaptchaMessage && chat.captchaMessage) {
        // TODO: investigate
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        chat.captchaMessage.message.chat = undefined;
        await ctx.telegram.sendCopy(chat.id, chat.captchaMessage.message, {
          ...Extra.notifications(!ctx.dbchat.silentMessages),
          entities: chat.captchaMessage.message.entities,
        });
      }
      await clarifyReply(ctx);

      return BotMiddlewareNextStrategy.abort;
    }),
  );
  // Setup checker
  addBotMiddleware(async (ctx, {next}) => {
    try {
      // Check if needs to check
      if (!ctx.dbchat.customCaptchaMessage) {
        return BotMiddlewareNextStrategy.async;
      }

      const {message} = ctx;

      // Check if reply
      if (!message || !message.reply_to_message) {
        return BotMiddlewareNextStrategy.async;
      }
      // Check if text
      if (!message.text) {
        return BotMiddlewareNextStrategy.async;
      }
      // Check if reply to shieldy
      if (
        !telegrafBot.botInfo ||
        !message.reply_to_message.from ||
        message.reply_to_message.from.id !== telegrafBot.botInfo.id
      ) {
        return BotMiddlewareNextStrategy.async;
      }
      // Check if reply to the correct message
      const captchaMessages = Object.keys(localizations.captchaMessage_true)
        .map((k) => localizations.captchaMessage_true[k])
        .concat(
          Object.keys(localizations.captchaMessage_true_message).map(
            (k) => localizations.captchaMessage_true_message[k],
          ),
        );
      if (
        !getReplyToMessageText(ctx) ||
        captchaMessages.indexOf(getReplyToMessageText(ctx)) < 0
      ) {
        return BotMiddlewareNextStrategy.async;
      }
      // Save text
      ctx.dbchat.captchaMessage = {
        message,
      };
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'captchaMessage',
        value: ctx.dbchat.captchaMessage,
      });

      idling.wrapTask(() =>
        ctx.reply(
          ctx.translate('greetsUsers_message_accepted'),
          Extra.inReplyTo(message.message_id) as ExtraReplyMessage,
        ),
      );
    } catch (err) {
      ctx.appContext.report(err);
    } finally {
      next();
    }

    return BotMiddlewareNextStrategy.async;
  });
}
