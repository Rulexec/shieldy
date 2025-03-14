import {checkIfFromReplierMiddleware} from '@middlewares/checkIfFromReplier';
import {CaptchaType} from '@models/Chat';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {wrapTelegrafContextWithIdling} from '@root/util/telegraf/idling-context-wrapper';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {L10nKey, T_} from '@root/i18n/l10n-key';
import {CommandDefSetupFn} from './types';

export const captchaCommand: BotMiddlewareFn = (ctx) => {
  const {
    chat,
    message,
    appContext: {telegramApi},
    translate,
  } = ctx;

  assertNonNullish(chat);
  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    text: ctx.translate(T_`captcha`),
    parse_mode: 'Markdown',
    reply_to_message_id: message.message_id,
    reply_markup: {
      inline_keyboard: [
        (
          [
            [T_`simple`, 'simple'],
            [T_`digits`, 'digits'],
            [T_`button`, 'button'],
            [T_`image`, 'image'],
            [T_`custom`, 'custom'],
          ] as const
        ).map(([text, callbackData]) => ({
          text: translate(text),
          callback_data: callbackData,
        })),
      ],
    },
    disable_notification: ctx.dbchat.silentMessages,
  });

  return Promise.resolve(BotMiddlewareNextStrategy.abort);
};

export const setupCaptchaCommand: CommandDefSetupFn = ({appContext}) => {
  const {addBotCallbackQuery, database, idling} = appContext;

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
};

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
      // eslint-disable-next-line local-rules/validate-l10n
      return T_`_captchaTypeToL10nKey_unknown_`;
    }
  }
};
