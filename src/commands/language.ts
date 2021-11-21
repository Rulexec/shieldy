import {clarifyIfPrivateMessages} from '@helpers/clarifyIfPrivateMessages';
import {Extra} from 'telegraf';
import {Bot} from '@root/types/index';
import {Language} from '@models/Chat';
import {checkIfFromReplier} from '@middlewares/checkIfFromReplier';
import {checkLock} from '@middlewares/checkLock';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export function setupLanguage(bot: Bot): void {
  bot.command('language', checkLock, clarifyIfPrivateMessages, (ctx) => {
    assertNonNullish(ctx.message);

    let extra = Extra.webPreview(false);
    extra = extra.inReplyTo(ctx.message.message_id);
    extra = extra.markup((m) =>
      m.inlineKeyboard([
        [m.callbackButton('English', 'en'), m.callbackButton('Русский', 'ru')],
        [m.callbackButton('Italiano', 'it'), m.callbackButton('Eesti', 'et')],
        [
          m.callbackButton('Українська', 'uk'),
          m.callbackButton('Português Brasil', 'br'),
        ],
        [m.callbackButton('Español', 'es'), m.callbackButton('Chinese', 'zh')],
        [
          m.callbackButton('Norwegian', 'no'),
          m.callbackButton('Deutsch', 'de'),
        ],
        [m.callbackButton('Taiwan', 'tw'), m.callbackButton('French', 'fr')],
        [
          m.callbackButton('Indonesian', 'id'),
          m.callbackButton('Korean', 'ko'),
        ],
        [m.callbackButton('Amharic', 'am'), m.callbackButton('Czech', 'cz')],
        [m.callbackButton('Arabic', 'ar'), m.callbackButton('Türkçe', 'tr')],
        [
          m.callbackButton('Romanian', 'ro'),
          m.callbackButton('Japanese', 'ja'),
        ],
        [m.callbackButton('Slovak', 'sk'), m.callbackButton('Catalan', 'ca')],
        [
          m.callbackButton('Cantonese', 'yue'),
          m.callbackButton('Hungarian', 'hu'),
        ],
        [
          m.callbackButton('Finnish', 'fi'),
          m.callbackButton('Bulgarian', 'bg'),
        ],
      ]),
    );
    extra = extra.notifications(!ctx.dbchat.silentMessages);

    ctx.replyWithMarkdown(ctx.translate('language_shieldy'), extra);
  });

  bot.action(
    [
      'en',
      'ru',
      'it',
      'et',
      'uk',
      'br',
      'tr',
      'es',
      'zh',
      'no',
      'de',
      'tw',
      'fr',
      'id',
      'ko',
      'am',
      'cz',
      'ar',
      'ja',
      'ro',
      'sk',
      'ca',
      'yue',
      'hu',
      'fi',
      'bg',
    ],
    checkIfFromReplier,
    async (ctx) => {
      assertNonNullish(ctx.callbackQuery);

      const chat = ctx.dbchat;
      chat.language = ctx.callbackQuery.data as Language;
      await ctx.appContext.database.setChatProperty({
        chatId: chat.id,
        property: 'language',
        value: chat.language,
      });
      const message = ctx.callbackQuery.message;

      ctx.telegram.editMessageText(
        message.chat.id,
        message.message_id,
        undefined,
        ctx.translate('language_selected'),
      );
    },
  );
}
