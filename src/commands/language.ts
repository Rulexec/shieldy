import {Language} from '@sesuritu/types/src/models/Chat';
import {checkIfFromReplierMiddleware} from '@middlewares/checkIfFromReplier';
import {checkLockMiddleware} from '@middlewares/checkLock';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {CommandDefSetupFn} from './types';

const languageButtons = [
  [
    ['English', 'en'],
    ['Русский', 'ru'],
  ],
  [
    ['Italiano', 'it'],
    ['Eesti', 'et'],
  ],
  [
    ['Українська', 'uk'],
    ['Português Brasil', 'br'],
  ],
  [
    ['Español', 'es'],
    ['Chinese', 'zh'],
  ],
  [
    ['Norwegian', 'no'],
    ['Deutsch', 'de'],
  ],
  [
    ['Taiwan', 'tw'],
    ['French', 'fr'],
  ],
  [
    ['Indonesian', 'id'],
    ['Korean', 'ko'],
  ],
  [
    ['Amharic', 'am'],
    ['Czech', 'cz'],
  ],
  [
    ['Arabic', 'ar'],
    ['Türkçe', 'tr'],
  ],
  [
    ['Romanian', 'ro'],
    ['Japanese', 'ja'],
  ],
  [
    ['Slovak', 'sk'],
    ['Catalan', 'ca'],
  ],
  [
    ['Cantonese', 'yue'],
    ['Hungarian', 'hu'],
  ],
  [
    ['Finnish', 'fi'],
    ['Bulgarian', 'bg'],
  ],
  [['Uzbek', Language.UZBEK]],
];

export const languageCommand: BotMiddlewareFn = (ctx) => {
  const {
    appContext: {telegramApi},
    dbchat: chat,
    message,
  } = ctx;

  assertNonNullish(message);

  telegramApi.sendMessage({
    chat_id: chat.id,
    reply_to_message_id: message.message_id,
    disable_notification: chat.silentMessages,
    text: ctx.translate(T_`language_selection`),
    reply_markup: {
      inline_keyboard: languageButtons.map((buttons) =>
        buttons.map(([name, key]) => ({text: name, callback_data: key})),
      ),
    },
  });

  return Promise.resolve(BotMiddlewareNextStrategy.abort);
};

export const setupLanguage: CommandDefSetupFn = ({
  appContext: {addBotCallbackQuery},
}) => {
  addBotCallbackQuery(
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
      'uz',
    ],
    checkLockMiddleware,
    checkIfFromReplierMiddleware,
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
        ctx.translate(T_`language_selected`),
      );

      return BotMiddlewareNextStrategy.abort;
    },
  );
};
