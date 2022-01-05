import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {checkIfFromReplier} from '@middlewares/checkIfFromReplier';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';

const options = [
  ['10', '20', '30'],
  ['60', '120', '240'],
];

export function setupTimeLimit(bot: Bot): void {
  bot.command('timeLimit', checkLock, clarifyIfPrivateMessages, async (ctx) => {
    assertNonNullish(ctx.message);
    assertNonNullish(bot.botInfo?.username);

    // Check if limit is set
    const limitNumber =
      +ctx.message.text.substr(11).trim() ||
      +ctx.message.text.substr(12 + bot.botInfo.username.length).trim();
    if (!isNaN(limitNumber) && limitNumber > 0 && limitNumber < 100000) {
      const chat = ctx.dbchat;
      chat.timeGiven = limitNumber;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'timeGiven',
        value: chat.timeGiven,
      });
      return ctx.replyWithMarkdown(
        `${ctx.translate(T_`time_limit_selected`)} (${
          chat.timeGiven
        } ${ctx.translate(T_`seconds`)})`,
        Extra.notifications(!ctx.dbchat.silentMessages),
      );
    }

    return ctx.replyWithMarkdown(
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

  bot.action(
    options.reduce((p, c) => p.concat(c), []),
    checkIfFromReplier,
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
    },
  );
}
