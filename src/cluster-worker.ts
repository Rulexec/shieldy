import {AppContext} from './types/app-context';
import {setupBot} from './updateHandler';

export function run(appContext: AppContext): void {
  const {telegrafBot: bot, logger} = appContext;
  logger.setKey(`worker${process.pid}`);

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
