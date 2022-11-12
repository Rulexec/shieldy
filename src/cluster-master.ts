import {Context} from 'telegraf';
import {fork} from 'cluster';
import {AppContext} from './types/app-context';
import {Logger} from './util/logging/logger';
import {BotMiddlewareNextStrategy} from './bot/types';
import {telegramSetMyCommands} from './commands/set-my-commands';
import {UniqueItemLogger} from './util/stats/unique-item-logger';

const workers: ReturnType<typeof fork>[] = [];

export function run(appContext: AppContext): void {
  appContext.logger = new Logger(`master${process.pid}`);

  const {prependBotMiddleware, logger} = appContext;

  const uniqueChatsStats = new UniqueItemLogger({
    name: 'chat',
    logger: logger.fork('uniqueChats'),
    getCurrentDate: appContext.getCurrentDate,
    maxItems: 1000,
    intervalSeconds: 55 * 60,
  });
  const uniqueUsersStats = new UniqueItemLogger({
    name: 'user',
    logger: logger.fork('uniqueUsers'),
    getCurrentDate: appContext.getCurrentDate,
    maxItems: 1000,
    intervalSeconds: 55 * 60,
  });

  appContext.onShutdown(() => {
    uniqueChatsStats.destroy();
    uniqueUsersStats.destroy();
    return Promise.resolve();
  });

  logger.info('start', {pid: process.pid});

  for (let i = 0; i < appContext.config.workersCount; i += 1) {
    const worker = fork();
    workers.push(worker);
  }

  let clusterNumber = 0;

  const {
    telegrafBot: bot,
    config: {isNeedUpdateAutocomplete},
  } = appContext;

  prependBotMiddleware((ctx) => {
    handleCtx(ctx);
    return BotMiddlewareNextStrategy.abort;
  });

  bot
    .launch({
      polling: {
        allowedUpdates: [
          'callback_query',
          'chosen_inline_result',
          'edited_message',
          'inline_query',
          'message',
          'poll',
          'poll_answer',
          'chat_member',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
      },
    })
    .then(() => {
      logger.info('started');

      if (isNeedUpdateAutocomplete) {
        telegramSetMyCommands({
          appContext,
          logger: logger.fork('setMyCommands'),
        }).catch((error) => {
          logger.error('setMyCommands', undefined, {error});
        });
      }
    })
    .catch(appContext.report);

  function handleCtx(ctx: Context) {
    const chatId = ctx.chat?.id;
    if (typeof chatId === 'number') {
      uniqueChatsStats.addItem(chatId);
    }

    const userId = ctx.message?.from?.id;
    if (typeof userId === 'number') {
      uniqueUsersStats.addItem(userId);
    }

    if (clusterNumber >= workers.length) {
      clusterNumber = 0;
    }
    const worker = workers[clusterNumber];
    if (worker) {
      clusterNumber += 1;
      worker.send(ctx.update);
    }
  }
}
