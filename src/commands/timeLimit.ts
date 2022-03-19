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
  const {
    appContext: {database, telegramApi, telegrafBot},
    dbchat: chat,
    message,
    botInfo,
  } = ctx;

  const botUsername = telegrafBot.botInfo?.username;

  assertNonNullish(message);
  assertNonNullish(botUsername);

  // Check if limit is set
  const limitNumber =
    +message.text.substr(11).trim() ||
    +message.text.substr(12 + botUsername.length).trim();

  if (!isNaN(limitNumber) && limitNumber > 0 && limitNumber < 100000) {
    chat.timeGiven = limitNumber;
    await database.setChatProperty({
      chatId: chat.id,
      property: 'timeGiven',
      value: chat.timeGiven,
    });
    await telegramApi.sendMessage({
      chat_id: chat.id,
      reply_to_message_id: message.message_id,
      disable_notification: chat.silentMessages,
      text: `${ctx.translate(T_`time_limit_selected`)} (${
        chat.timeGiven
      } ${ctx.translate(T_`seconds`)})`,
    });
    return;
  }

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(T_`time_limit`),
    reply_markup: {
      inline_keyboard: options.map((a) =>
        a.map((o) => ({
          text: `${o} ${ctx.translate(T_`seconds`)}`,
          callback_data: o,
        })),
      ),
    },
  });
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
