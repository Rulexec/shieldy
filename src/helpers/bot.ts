import TelegrafBot from 'telegraf';
import {Bot} from '@root/types/bot';
import {AppContext} from '@root/types/app-context';

export function createTelegrafBot({
  config: {telegramToken, telegramApiRoot},
}: AppContext): Bot {
  return new TelegrafBot(telegramToken, {
    handlerTimeout: 1,
    telegram: {
      apiRoot: telegramApiRoot,
    },
  });
}
