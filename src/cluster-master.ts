import {Context} from 'telegraf';
import {fork} from 'cluster';
import {AppContext} from './types/app-context';
import {Logger} from './util/logging/logger';
import {BotMiddlewareNextStrategy} from './bot/types';

const workers: ReturnType<typeof fork>[] = [];

export function run(appContext: AppContext): void {
  appContext.logger = new Logger(`master${process.pid}`);

  const {prependBotMiddleware, logger} = appContext;

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
    })
    .catch(appContext.report);

  function handleCtx(ctx: Context) {
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
