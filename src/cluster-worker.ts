import {AppContext} from './types/app-context';
import {setupBot} from './updateHandler';
import {Logger} from './util/logging/logger';

export function run(appContext: AppContext): void {
  appContext.logger = new Logger(`worker${process.pid}`);

  const {telegrafBot: bot, logger} = appContext;

  setupBot(appContext);

  logger.info('start', {pid: process.pid});
  process.on('message', (update) => {
    bot.handleUpdate(update);
  });

  // Start bot
  bot.telegram
    .getMe()
    .then((botInfo) => {
      bot.botInfo = botInfo;
      bot.options.username = botInfo.username;
      logger.info('started');
    })
    .catch(appContext.report);
}
