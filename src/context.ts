import {Database} from '@root/types/database';
import {appContextKeys, Config} from '@root/types/app-context';
import {getConfig} from './config';
import {MongoDatabase} from './database/mongo/database';
import {createTelegrafBot} from './helpers/bot';
import {createDefaultChat} from './helpers/create-default-chat';
import {initReporter} from './helpers/report';
import {AppContext} from './types/app-context';
import {IdlingStatus} from './util/state/idling-status';
import {initBotMiddlewaresEngine} from './bot/bot';
import {Logger} from './util/logging/logger';

export type ContextOptions = {
  instanceId: string;
  config: Config;
  createDatabase: ({appContext: AppContext}) => Database;
  getCurrentDate: () => Date;
};

export function createContext({
  instanceId,
  config: customConfig,
  createDatabase = ({appContext}) => new MongoDatabase({appContext}),
  getCurrentDate = () => new Date(),
}: Partial<ContextOptions> = {}): AppContext {
  const idling = new IdlingStatus();
  const config = customConfig || getConfig();
  const logger = new Logger(instanceId || 'main', {logLevel: config.logLevel});

  const initialAppContext: Partial<AppContext> = {
    init: undefined,
    stop: undefined,
    run: undefined,
    logger,
    config,
    database: undefined,
    createDefaultChat,
    telegrafBot: undefined,
    telegramApi: {
      replyWithMarkdown: (context, markdown, extra) => {
        return idling.wrapTask(() =>
          context.replyWithMarkdown(markdown, extra),
        );
      },
    },
    report: undefined,
    getCurrentDate,
    idling,
    addBotCommand: undefined,
    prependBotMiddleware: undefined,
    addBotMiddleware: undefined,
    addBotCallbackQuery: undefined,
  };

  // Unsafe, but we promise, that all fields will be filled
  // and undefined fields will be not used on initialization
  const appContext = initialAppContext as AppContext;

  appContext.database = createDatabase({appContext});
  const bot = createTelegrafBot(appContext);
  appContext.telegrafBot = bot;

  initBotMiddlewaresEngine(appContext);

  const {onShutdown: reportedShutdown} = initReporter(appContext);

  appContext.init = async () => {
    await appContext.database.init();
  };

  appContext.stop = async () => {
    await bot.stop();
    await reportedShutdown();
  };

  appContext.run = (fun) => {
    appContext
      .init()
      .then(() => {
        return fun();
      })
      .catch((error) => {
        appContext.report(error);

        appContext
          .stop()
          .catch(appContext.report)
          .finally(() => {
            process.exit(1);
          });
      });
  };

  for (const key of appContextKeys) {
    const value = appContext[key];

    if (!value) {
      throw new Error(`appContext: no value for ${key}`);
    }
  }

  return appContext;
}
