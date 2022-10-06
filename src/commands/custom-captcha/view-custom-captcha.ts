import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';

export const viewCustomCaptchaCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {telegramApi},
    dbchat: chat,
  } = ctx;

  let text = '';

  const tQuestion = ctx.translate(T_`custom_question_colon`);
  const tAnswer = ctx.translate(T_`custom_answer_colon`);

  chat.customCaptchaVariants.forEach((variant, i) => {
    const {question, answer} = variant;

    if (i !== 0) {
      text += '\n\n';
    }
    text += `${i + 1}. ${tQuestion} ${question}\n${tAnswer} ${answer}`;
  });

  if (!text) {
    text = ctx.translate(T_`custom_no_variants`);
  }

  await telegramApi.sendMessage({
    chat_id: chat.id,
    disable_notification: chat.silentMessages,
    text,
  });

  return BotMiddlewareNextStrategy.abort;
};
