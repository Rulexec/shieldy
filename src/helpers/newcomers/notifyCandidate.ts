import {ExtraReplyMessage} from 'telegraf/typings/telegram-types';
import {cloneDeep} from 'lodash';
import {CaptchaType} from '@sesuritu/types/src/models/Chat';
import {User} from 'telegram-typings';
import {Extra} from 'telegraf';
import {Context} from '@sesuritu/types/src/context';
import {constructMessageWithEntities} from '@helpers/newcomers/constructMessageWithEntities';
import {getName, getUsername} from '@helpers/getUsername';
import {Captcha} from './generateCaptcha';
import {formatHTML} from '@sesuritu/types/src/hacks/format-html';
import {getChatTitle} from '@sesuritu/types/src/hacks/get-chat-title';
import {L10nKey, T_} from '@sesuritu/types/src/i18n/l10n-key';

export async function notifyCandidate(
  ctx: Context,
  candidate: User,
  captcha: Captcha,
): Promise<{message_id: number}> {
  const {
    appContext: {telegramApi, logger},
  } = ctx;

  const chat = ctx.dbchat;
  const {silentMessages} = chat;
  const captchaMessage = ctx.dbchat.captchaMessage
    ? cloneDeep(ctx.dbchat.captchaMessage)
    : undefined;
  const {equation, image} = captcha;

  const isDegradatedCustom =
    captcha.captchaType === CaptchaType.CUSTOM && !captcha.customCaptcha;

  let extra =
    captcha.captchaType !== CaptchaType.BUTTON
      ? Extra.webPreview(false)
      : Extra.webPreview(false).markup((m) =>
          m.inlineKeyboard([
            m.callbackButton(
              chat.buttonText || ctx.translate(T_`captcha_button`),
              `${chat.id}~${candidate.id}`,
            ),
          ]),
        );

  extra = extra.notifications(!silentMessages);

  const getUserMention = async () => {
    if (chat.customCaptchaMessage && captchaMessage) {
      const text = captchaMessage.message.text;

      if (
        text.includes('$username') ||
        text.includes('$title') ||
        text.includes('$equation') ||
        text.includes('$seconds') ||
        text.includes('$fullname')
      ) {
        const messageToSend = constructMessageWithEntities(
          captchaMessage.message,
          candidate,
          {
            $username: getUsername(candidate),
            $fullname: getName(candidate),
            $title: await getChatTitle(ctx),
            $equation: equation ? (equation.question as string) : '',
            $seconds: `${chat.timeGiven}`,
          },
        );

        return formatHTML(messageToSend.text, messageToSend.entities);
      } else {
        const message = cloneDeep(captchaMessage.message);
        const formattedText = formatHTML(message.text, message.entities);

        return `<a href="tg://user?id=${candidate.id}">${getUsername(
          candidate,
        )}</a>, ${formattedText}`;
      }
    }

    return `<a href="tg://user?id=${candidate.id}">${getUsername(
      candidate,
    )}</a>`;
  };

  if (
    chat.customCaptchaMessage &&
    captchaMessage &&
    ((chat.captchaType !== CaptchaType.DIGITS &&
      chat.captchaType !== CaptchaType.CUSTOM) ||
      captchaMessage.message.text.includes('$equation'))
  ) {
    // FIXME: copypaste of `getUserMention()`
    const text = captchaMessage.message.text;
    if (
      text.includes('$username') ||
      text.includes('$title') ||
      text.includes('$equation') ||
      text.includes('$seconds') ||
      text.includes('$fullname')
    ) {
      const messageToSend = constructMessageWithEntities(
        captchaMessage.message,
        candidate,
        {
          $username: getUsername(candidate),
          $fullname: getName(candidate),
          $title: await getChatTitle(ctx),
          $equation: equation ? (equation.question as string) : '',
          $seconds: `${chat.timeGiven}`,
        },
      );
      if (image) {
        extra = extra.HTML(true).notifications(!silentMessages);
        const formattedText = formatHTML(
          messageToSend.text,
          messageToSend.entities,
        );
        return ctx.replyWithPhoto(
          {source: image.png},
          {
            caption: formattedText,
            ...(extra as ExtraReplyMessage),
          },
        );
      } else {
        // TODO: investigate
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        messageToSend.chat = undefined;
        return ctx.telegram.sendCopy(chat.id, messageToSend, {
          ...(extra as ExtraReplyMessage),
          entities: messageToSend.entities,
        });
      }
    } else {
      extra = extra.HTML(true).notifications(!silentMessages);
      const message = cloneDeep(captchaMessage.message);
      const formattedText = formatHTML(message.text, message.entities);

      message.text = `${getUsername(candidate)}\n\n${formattedText}`;

      try {
        // TODO: investigate
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        message.chat = undefined;
        const sentMessage = await ctx.telegram.sendCopy(chat.id, message, {
          ...(extra as ExtraReplyMessage),
          entities: message.entities,
        });
        return sentMessage;
      } catch (err) {
        message.entities = [];
        // TODO: investigate
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        message.chat = undefined;
        const sentMessage = await ctx.telegram.sendCopy(chat.id, message, {
          ...(extra as ExtraReplyMessage),
          entities: message.entities,
        });
        return sentMessage;
      }
    }
  } else {
    extra = extra.HTML(true).notifications(!silentMessages);

    let message: string | null = null;

    if (captcha.captchaType === CaptchaType.CUSTOM) {
      const {customCaptcha} = captcha;
      if (customCaptcha) {
        message = ', ' + customCaptcha.question;
      } else {
        // Degradate to simple captcha if no custom variants
        message = ctx.translate(T_`simple_warning`);
      }
    }

    if (!message) {
      message = ctx.translate(
        captchaTypeToWarningMessage(
          isDegradatedCustom ? CaptchaType.SIMPLE : captcha.captchaType,
        ),
      );
    }

    const text = `${await getUserMention()}${message} (${
      chat.timeGiven
    } ${ctx.translate(T_`seconds`)})`;

    if (image) {
      return ctx.replyWithPhoto(
        {source: image.png},
        {
          caption: text,
          parse_mode: 'HTML',
          disable_notification: Boolean(silentMessages),
        },
      );
    } else {
      logger.error('notifyCandidate:96716187e5876ea1');

      return telegramApi.sendMessage({
        chat_id: chat.id,
        disable_notification: chat.silentMessages,
        text:
          (chat.captchaType === CaptchaType.DIGITS
            ? `(${equation ? equation.question : 'ERROR_96716187e5876ea1'}) `
            : '') + text,
        parse_mode: 'HTML',
      });
    }
  }
}

const captchaTypeToWarningMessage = (type: CaptchaType): L10nKey => {
  switch (type) {
    case CaptchaType.SIMPLE:
      return T_`simple_warning`;
    case CaptchaType.DIGITS:
      return T_`digits_warning`;
    case CaptchaType.BUTTON:
      return T_`button_warning`;
    case CaptchaType.IMAGE:
      return T_`image_warning`;
    case CaptchaType.CUSTOM:
      // eslint-disable-next-line local-rules/validate-l10n
      return T_`_captchaTypeToWarningMessage_custom_warning_`;
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const shouldBeNever: never = type;
      // eslint-disable-next-line local-rules/validate-l10n
      return T_`_captchaTypeToWarningMessage_unknown_`;
    }
  }
};
