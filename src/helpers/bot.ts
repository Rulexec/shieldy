import TelegrafBot from 'telegraf';
import {Bot} from '@sesuritu/types/src/bot';
import {AppContext} from '@sesuritu/types/src/app-context';

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
