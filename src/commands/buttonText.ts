import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export const buttonTextCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {database},
    dbchat: chat,
    message,
  } = ctx;

  assertNonNullish(message);

  const text = message.text.substr(12);
  if (!text) {
    chat.buttonText = undefined;
  } else {
    chat.buttonText = text;
  }
  await database.setChatProperty({
    chatId: chat.id,
    property: 'buttonText',
    value: chat.buttonText,
  });
  await ctx.replyWithMarkdown(
    ctx.translate(T_`trust_success`),
    Extra.inReplyTo(message.message_id).notifications(!chat.silentMessages),
  );

  return BotMiddlewareNextStrategy.abort;
};
