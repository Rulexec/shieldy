import {clarifyIfPrivateMessagesMiddleware} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {checkIfFromReplierMiddleware} from '@middlewares/checkIfFromReplier';
import {CaptchaType} from '@models/Chat';
import {checkLockMiddleware} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {wrapTelegrafContextWithIdling} from '@root/util/telegraf/idling-context-wrapper';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareNextStrategy} from '@root/bot/types';
import {L10nKey, T_} from '@root/i18n/l10n-key';

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
          ctx.translate(T_`captcha`),
          Extra.inReplyTo(message.message_id)
            .markup((m) =>
              m.inlineKeyboard([
                m.callbackButton(ctx.translate(T_`simple`), 'simple'),
                m.callbackButton(ctx.translate(T_`digits`), 'digits'),
                m.callbackButton(ctx.translate(T_`button`), 'button'),
                m.callbackButton(ctx.translate(T_`image`), 'image'),
                m.callbackButton(ctx.translate(T_`custom`), 'custom'),
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
          `${ctx.translate(T_`captcha_selected`)} (${ctx.translate(
            captchaTypeToL10nKey(chat.captchaType),
          )})`,
        ),
      );

      return BotMiddlewareNextStrategy.abort;
    }),
  );
}

const captchaTypeToL10nKey = (type: CaptchaType): L10nKey => {
  switch (type) {
    case CaptchaType.SIMPLE:
      return T_`simple`;
    case CaptchaType.DIGITS:
      return T_`digits`;
    case CaptchaType.BUTTON:
      return T_`button`;
    case CaptchaType.IMAGE:
      return T_`image`;
    case CaptchaType.CUSTOM:
      return T_`custom`;
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const shouldBeNever: never = type;
      return T_`_captchaTypeToL10nKey_unknown_`;
    }
  }
};
