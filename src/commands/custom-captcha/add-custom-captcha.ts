import {Context} from '@root/types/index';
import {ReplySettingType} from '@models/Chat';
import {clarifyReply} from '@helpers/clarifyReply';
import {isReplyToShieldy} from '@helpers/isReplyToShieldy';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {T_} from '@root/i18n/l10n-key';
import {CommandDefSetupFn} from '../types';

export const addCustomCaptchaCommand: BotMiddlewareFn = async (ctx) => {
  const {
    appContext: {telegramApi},
    dbchat: chat,
  } = ctx;

  const message = await telegramApi.sendMessage({
    chat_id: chat.id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(T_`custom_add_question`),
  });

  chat.lastReplySetting = {
    type: ReplySettingType.ADD_CUSTOM_CAPTCHA,
    messageId: message.message_id,
  };
  await ctx.appContext.database.setChatProperty({
    chatId: chat.id,
    property: 'lastReplySetting',
    value: chat.lastReplySetting,
  });
  await clarifyReply(ctx);

  return BotMiddlewareNextStrategy.abort;
};

export const setupAddCustomCaptcha: CommandDefSetupFn = ({appContext}) => {
  const {telegrafBot, addBotMiddleware} = appContext;

  // Handle reactions to replies
  async function processReply(ctx: Context) {
    const text = ctx.message?.text?.trim();
    if (!text) {
      return;
    }
    if (!isReplyToShieldy({ctx, bot: telegrafBot})) {
      return;
    }

    const messageReplyId = ctx.message?.reply_to_message?.message_id;
    const replySetting = ctx.dbchat.lastReplySetting;

    // Check that it is reply to custom captcha settings message
    if (!replySetting) {
      return;
    }
    if (replySetting.messageId !== messageReplyId) {
      return;
    }

    switch (replySetting.type) {
      case ReplySettingType.ADD_CUSTOM_CAPTCHA:
        return await processAddCustomCaptchaReply(ctx, text);
      case ReplySettingType.ADD_CUSTOM_CAPTCHA_ANSWER:
        return await processAddCustomCaptchaAnswerReply(ctx, text);
    }
  }
  async function processAddCustomCaptchaReply(
    ctx: Context,
    customCaptchaQuestion: string,
  ) {
    const {
      appContext: {telegramApi},
      dbchat: chat,
    } = ctx;

    const botMessage = await telegramApi.sendMessage({
      chat_id: chat.id,
      disable_notification: chat.silentMessages,
      text: ctx.translate(T_`custom_add_answer`),
    });

    chat.lastReplySetting = {
      type: ReplySettingType.ADD_CUSTOM_CAPTCHA_ANSWER,
      messageId: botMessage.message_id,
      customCaptchaQuestion,
    };
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'lastReplySetting',
      value: chat.lastReplySetting,
    });
  }
  async function processAddCustomCaptchaAnswerReply(
    ctx: Context,
    customCaptchaAnswer: string,
  ) {
    const {
      appContext: {telegramApi},
      message,
      dbchat: chat,
    } = ctx;

    const {lastReplySetting} = chat;
    if (!message || !lastReplySetting) {
      return;
    }

    const {customCaptchaQuestion} = lastReplySetting;
    if (!customCaptchaQuestion) {
      return;
    }

    const answer = customCaptchaAnswer
      .toLowerCase()
      .split(',')
      .map((x) => x.trim())
      .join(',');

    // Find available id for variant
    let variantId = 1;
    chat.customCaptchaVariants.some((variant) => {
      const isCollision = variant.id === variantId;

      if (isCollision) {
        variantId++;
      }

      return !isCollision;
    });

    chat.customCaptchaVariants.push({
      id: variantId,
      question: customCaptchaQuestion,
      answer,
    });
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'customCaptchaVariants',
      value: chat.customCaptchaVariants,
    });

    await telegramApi.sendMessage({
      chat_id: chat.id,
      reply_to_message_id: message.message_id,
      disable_notification: chat.silentMessages,
      text: ctx.translate(T_`custom_success`),
    });
  }

  addBotMiddleware(async (ctx) => {
    try {
      await processReply(ctx);
    } catch (err) {
      ctx.appContext.report(err);
    }

    return BotMiddlewareNextStrategy.next;
  });
};
