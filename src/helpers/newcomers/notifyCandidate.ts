import {
  ExtraReplyMessage,
  Message,
  MessagePhoto,
} from 'telegraf/typings/telegram-types';
import {cloneDeep} from 'lodash';
import {CaptchaType} from '@models/Chat';
import {User} from 'telegram-typings';
import {Extra} from 'telegraf';
import {Context} from '@root/types/context';
import {constructMessageWithEntities} from '@helpers/newcomers/constructMessageWithEntities';
import {getName, getUsername} from '@helpers/getUsername';
import {Captcha} from './generateCaptcha';
import {formatHTML} from '@root/types/hacks/format-html';
import {getChatTitle} from '@root/types/hacks/get-chat-title';

export async function notifyCandidate(
  ctx: Context,
  candidate: User,
  captcha: Captcha,
): Promise<Message | MessagePhoto> {
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
              chat.buttonText || ctx.translate('captcha_button'),
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
        message = ctx.translate('simple_warning');
      }
    }

    if (!message) {
      message = ctx.translate(
        `${
          isDegradatedCustom ? CaptchaType.SIMPLE : captcha.captchaType
        }_warning`,
      );
    }

    const text = `${await getUserMention()}${message} (${
      chat.timeGiven
    } ${ctx.translate('seconds')})`;

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
      // FIXME: logging

      return ctx.replyWithMarkdown(
        (chat.captchaType === CaptchaType.DIGITS
          ? `(${equation ? equation.question : 'ERROR_96716187e5876ea1'}) `
          : '') + text,
        extra,
      );
    }
  }
}
