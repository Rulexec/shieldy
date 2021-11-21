import {clarifyIfPrivateMessagesMiddleware} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Context} from '@root/types/index';
import {ReplySettingType} from '@models/Chat';
import {checkLockMiddleware} from '@middlewares/checkLock';
import {clarifyReply} from '@helpers/clarifyReply';
import {isReplyToShieldy} from '@helpers/isReplyToShieldy';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export function setupCustomCaptcha(appContext: AppContext): void {
  const {telegrafBot, addBotCommand, addBotMiddleware} = appContext;

  addBotCommand(
    'viewCustomCaptcha',
    checkLockMiddleware,
    clarifyIfPrivateMessagesMiddleware,
    async (ctx) => {
      let text = '';

      const tQuestion = ctx.translate('custom_question_colon');
      const tAnswer = ctx.translate('custom_answer_colon');

      ctx.dbchat.customCaptchaVariants.forEach((variant, i) => {
        const {question, answer} = variant;

        if (i !== 0) {
          text += '\n\n';
        }
        text += `${i + 1}. ${tQuestion} ${question}\n${tAnswer} ${answer}`;
      });

      if (!text) {
        text = ctx.translate('custom_no_variants');
      }

      await ctx.replyWithMarkdown(
        text,
        Extra.notifications(!ctx.dbchat.silentMessages),
      );

      return BotMiddlewareNextStrategy.abort;
    },
  );

  addBotCommand(
    'removeAllCustomCaptcha',
    checkLockMiddleware,
    clarifyIfPrivateMessagesMiddleware,
    async (ctx) => {
      ctx.dbchat.customCaptchaVariants = [];
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'customCaptchaVariants',
        value: ctx.dbchat.customCaptchaVariants,
      });

      await ctx.replyWithMarkdown(
        ctx.translate('custom_removed'),
        Extra.notifications(!ctx.dbchat.silentMessages),
      );

      return BotMiddlewareNextStrategy.abort;
    },
  );

  addBotCommand(
    'addCustomCaptcha',
    checkLockMiddleware,
    clarifyIfPrivateMessagesMiddleware,
    async (ctx) => {
      const message = await ctx.replyWithMarkdown(
        ctx.translate('custom_add_question'),
        Extra.notifications(!ctx.dbchat.silentMessages),
      );
      ctx.dbchat.lastReplySetting = {
        type: ReplySettingType.ADD_CUSTOM_CAPTCHA,
        messageId: message.message_id,
      };
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'lastReplySetting',
        value: ctx.dbchat.lastReplySetting,
      });
      await clarifyReply(ctx);

      return BotMiddlewareNextStrategy.abort;
    },
  );

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
    const botMessage = await ctx.replyWithMarkdown(
      ctx.translate('custom_add_answer'),
      Extra.notifications(!ctx.dbchat.silentMessages),
    );

    ctx.dbchat.lastReplySetting = {
      type: ReplySettingType.ADD_CUSTOM_CAPTCHA_ANSWER,
      messageId: botMessage.message_id,
      customCaptchaQuestion,
    };
    await ctx.appContext.database.setChatProperty({
      chatId: ctx.dbchat.id,
      property: 'lastReplySetting',
      value: ctx.dbchat.lastReplySetting,
    });
  }
  async function processAddCustomCaptchaAnswerReply(
    ctx: Context,
    customCaptchaAnswer: string,
  ) {
    const {lastReplySetting} = ctx.dbchat;
    if (!ctx.message || !lastReplySetting) {
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

    ctx.dbchat.customCaptchaVariants.push({
      question: customCaptchaQuestion,
      answer,
    });
    await ctx.appContext.database.setChatProperty({
      chatId: ctx.dbchat.id,
      property: 'customCaptchaVariants',
      value: ctx.dbchat.customCaptchaVariants,
    });

    await ctx.replyWithMarkdown(
      ctx.translate('custom_success'),
      Extra.inReplyTo(ctx.message.message_id).notifications(
        !ctx.dbchat.silentMessages,
      ),
    );
  }

  addBotMiddleware(async (ctx) => {
    try {
      await processReply(ctx);
    } catch (err) {
      ctx.appContext.report(err);
    }

    return BotMiddlewareNextStrategy.next;
  });
}
