import {clarifyReply} from '@helpers/clarifyReply';
import {Extra} from 'telegraf';
import {getReplyToMessageText} from '@root/types/hacks/get-message-text';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';
import {CommandDefSetupFn} from './types';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export const greetingButtonsCommand = commandHandler(async (ctx) => {
  assertNonNullish(ctx.message);

  await ctx.replyWithMarkdown(
    `${ctx.translate(T_`greetingButtons`)}`,
    Extra.inReplyTo(ctx.message.message_id)
      .webPreview(false)
      .notifications(!ctx.dbchat.silentMessages),
  );
  await ctx.replyWithMarkdown(
    `<code>${
      ctx.dbchat.greetingButtons || ctx.translate(T_`greetingButtonsEmpty`)
    }</code>`,
    Extra.webPreview(false)
      .HTML(true)
      .notifications(!ctx.dbchat.silentMessages),
  );
  await clarifyReply(ctx);
});

export const setupGreetingButtons: CommandDefSetupFn = ({
  appContext: {addBotMiddleware},
}) => {
  addBotMiddleware(async (ctx) => {
    const {
      appContext: {
        translations: {getLanguagesList, translate},
        telegrafBot: bot,
      },
    } = ctx;

    try {
      // Check if reply
      if (!ctx.message || !ctx.message.reply_to_message) {
        return BotMiddlewareNextStrategy.next;
      }
      // Check if text
      if (!ctx.message.text) {
        return BotMiddlewareNextStrategy.next;
      }
      // Check if reply to shieldy
      if (
        !bot.botInfo ||
        !ctx.message.reply_to_message.from ||
        !ctx.message.reply_to_message.from.username ||
        ctx.message.reply_to_message.from.username !== bot.botInfo.username
      ) {
        return BotMiddlewareNextStrategy.next;
      }
      // Check if reply to the correct message
      // FIXME: migrate to `lastReplySetting`/whatever, do not check by text
      const greetingButtonsMessages = getLanguagesList().map((lang) =>
        translate(lang, T_`greetingButtons`),
      );
      const messageReplyText = getReplyToMessageText(ctx);
      if (
        !messageReplyText ||
        greetingButtonsMessages.indexOf(messageReplyText) < 0
      ) {
        return BotMiddlewareNextStrategy.next;
      }
      // Check format
      const components = ctx.message.text.split('\n');
      const result: string[] = [];
      for (const component of components) {
        const parts = component.split(' - ');
        if (parts.length !== 2) {
          // Default
          ctx.dbchat.greetingButtons = undefined;
          await ctx.appContext.database.setChatProperty({
            chatId: ctx.dbchat.id,
            property: 'greetingButtons',
            value: ctx.dbchat.greetingButtons,
          });
          return BotMiddlewareNextStrategy.next;
        } else {
          result.push(component);
        }
      }
      // Save text
      ctx.dbchat.greetingButtons = result.join('\n');
      await ctx.appContext.database.setChatProperty({
        chatId: ctx.dbchat.id,
        property: 'greetingButtons',
        value: ctx.dbchat.greetingButtons,
      });
      ctx.reply(
        ctx.translate(T_`greetsUsers_message_accepted`),
        Extra.inReplyTo(ctx.message.message_id),
      );
    } catch (err) {
      ctx.appContext.report(err);
    }

    return BotMiddlewareNextStrategy.next;
  });
};
