import {Context} from 'telegraf';
import {fork} from 'cluster';
import {AppContext} from '@sesuritu/types/src/app-context';
import {Logger} from '@sesuritu/util/src/logging/logger';
import {BotMiddlewareNextStrategy} from './bot/types';
import {createStatsUniqueLogger} from '@sesuritu/util/src/stats/stats-unique-logger';
import {telegramSetMyCommands} from './commands/set-my-commands';

const workers: ReturnType<typeof fork>[] = [];

export function run(appContext: AppContext): void {
  appContext.logger = new Logger(`master${process.pid}`);

  const {prependBotMiddleware, logger} = appContext;

  const uniqueChatsStats = createStatsUniqueLogger({name: 'chats', logger});
  const uniqueUsersStats = createStatsUniqueLogger({name: 'users', logger});

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

  const {telegrafBot: bot} = appContext;

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

      telegramSetMyCommands({
        appContext,
        logger: logger.fork('setMyCommands'),
      }).catch((error) => {
        logger.error('setMyCommands', undefined, {error});
      });
    })
    .catch(appContext.report);

  function handleCtx(ctx: Context) {
    const chatId = ctx.chat?.id;
    if (typeof chatId === 'number') {
      uniqueChatsStats.collect(chatId);
    }

    const userId = ctx.message?.from?.id;
    if (typeof userId === 'number') {
      uniqueUsersStats.collect(userId);
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
