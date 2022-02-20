import {Extra} from 'telegraf';
import {checkIfFromReplierMiddleware} from '@middlewares/checkIfFromReplier';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';
import {CommandDefSetupFn} from './types';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

const options = [
  ['10', '20', '30'],
  ['60', '120', '240'],
];

export const timeLimitCommand = commandHandler(async (ctx) => {
  const botUsername = ctx.appContext.telegrafBot.botInfo?.username;

  assertNonNullish(ctx.message);
  assertNonNullish(botUsername);

  // Check if limit is set
  const limitNumber =
    +ctx.message.text.substr(11).trim() ||
    +ctx.message.text.substr(12 + botUsername.length).trim();
  if (!isNaN(limitNumber) && limitNumber > 0 && limitNumber < 100000) {
    const chat = ctx.dbchat;
    chat.timeGiven = limitNumber;
    await ctx.appContext.database.setChatProperty({
      chatId: chat.id,
      property: 'timeGiven',
      value: chat.timeGiven,
    });
    await ctx.replyWithMarkdown(
      `${ctx.translate(T_`time_limit_selected`)} (${
        chat.timeGiven
      } ${ctx.translate(T_`seconds`)})`,
      Extra.notifications(!ctx.dbchat.silentMessages),
    );
    return;
  }

  ctx.replyWithMarkdown(
    ctx.translate(T_`time_limit`),
    Extra.inReplyTo(ctx.message.message_id)
      .markup((m) =>
        m.inlineKeyboard(
          options.map((a) =>
            a.map((o) =>
              m.callbackButton(`${o} ${ctx.translate(T_`seconds`)}`, o),
            ),
          ),
        ),
      )
      .notifications(!ctx.dbchat.silentMessages),
  );
});

export const setupTimeLimit: CommandDefSetupFn = ({
  appContext: {addBotCallbackQuery},
}) => {
  addBotCallbackQuery(
    options.reduce((p, c) => p.concat(c), []),
    checkIfFromReplierMiddleware,
    async (ctx) => {
      assertNonNullish(ctx.callbackQuery);

      const chat = ctx.dbchat;
      chat.timeGiven = Number(ctx.callbackQuery.data);
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'timeGiven',
        value: chat.timeGiven,
      });
      const message = ctx.callbackQuery.message;

      ctx.telegram.editMessageText(
        message.chat.id,
        message.message_id,
        undefined,
        `${ctx.translate(T_`time_limit_selected`)} (${
          chat.timeGiven
        } ${ctx.translate(T_`seconds`)})`,
      );

      return BotMiddlewareNextStrategy.abort;
    },
  );
};
