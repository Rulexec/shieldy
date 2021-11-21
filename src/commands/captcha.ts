import {clarifyIfPrivateMessagesMiddleware} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {checkIfFromReplierMiddleware} from '@middlewares/checkIfFromReplier';
import {CaptchaType} from '@models/Chat';
import {checkLockMiddleware} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {wrapTelegrafContextWithIdling} from '@root/util/telegraf/idling-context-wrapper';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export function setupCaptcha(appContext: AppContext): void {
  const {addBotCommand, addBotCallbackQuery, database, idling} = appContext;

  addBotCommand(
    'captcha',
    checkLockMiddleware,
    clarifyIfPrivateMessagesMiddleware,
    (ctx) => {
      const {message} = ctx;

      assertNonNullish(message);

      idling.wrapTask(() =>
        ctx.appContext.telegramApi.replyWithMarkdown(
          ctx,
          ctx.translate('captcha'),
          Extra.inReplyTo(message.message_id)
            .markup((m) =>
              m.inlineKeyboard([
                m.callbackButton(ctx.translate('simple'), 'simple'),
                m.callbackButton(ctx.translate('digits'), 'digits'),
                m.callbackButton(ctx.translate('button'), 'button'),
                m.callbackButton(ctx.translate('image'), 'image'),
                m.callbackButton(ctx.translate('custom'), 'custom'),
              ]),
            )
            .notifications(!ctx.dbchat.silentMessages),
        ),
      );

      return BotMiddlewareNextStrategy.abort;
    },
  );

  addBotCallbackQuery(
    ['simple', 'digits', 'button', 'image', 'custom'],
    checkIfFromReplierMiddleware,
    wrapTelegrafContextWithIdling(async (ctx) => {
      assertNonNullish(ctx.callbackQuery);

      const chat = ctx.dbchat;
      chat.captchaType = ctx.callbackQuery.data as CaptchaType;
      await database.setChatProperty({
        chatId: chat.id,
        property: 'captchaType',
        value: chat.captchaType,
      });
      const message = ctx.callbackQuery.message;

      idling.wrapTask(() =>
        ctx.telegram.editMessageText(
          message.chat.id,
          message.message_id,
          undefined,
          `${ctx.translate('captcha_selected')} (${ctx.translate(
            chat.captchaType,
          )})`,
        ),
      );

      return BotMiddlewareNextStrategy.abort;
    }),
  );
}
