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
import {Translations} from './i18n/translations';
import {createFsPoTranslationsLoader} from './i18n/translations-loader-fs-po';

export type ContextOptions = Partial<{
  isWorker: boolean;
  instanceId: string;
  config: Config;
  createDatabase: (options: {appContext: AppContext}) => Database;
  createTranslations: (options: {appContext: AppContext}) => Translations;
  getCurrentDate: () => Date;
}>;

const defaultTranslationsLoader = ({appContext}: {appContext: AppContext}) =>
  createFsPoTranslationsLoader({
    l10nFilesPath: appContext.config.l10nFilesPath,
  });

const defaultCreateTranslations = ({appContext}: {appContext: AppContext}) =>
  new Translations({
    getTranslationsLoader: defaultTranslationsLoader,
    logger: appContext.logger.fork('l10n'),
  });

export function createContext({
  isWorker = true,
  instanceId,
  config: customConfig,
  createDatabase = ({appContext}) => new MongoDatabase({appContext}),
  createTranslations = defaultCreateTranslations,
  getCurrentDate = () => new Date(),
}: ContextOptions = {}): AppContext {
  const idling = new IdlingStatus();
  const config = customConfig || getConfig();
  const logger = new Logger(instanceId || 'main', {logLevel: config.logLevel});

  const shutdownHandlers: (() => Promise<void>)[] = [];

  const initialAppContext: Partial<AppContext> = {
    isWorker,
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
          context.replyWithMarkdown(markdown, {
            ...extra,
            disable_notification: Boolean(context.dbchat?.silentMessages),
          }),
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
    onShutdown: (handler) => {
      shutdownHandlers.push(handler);
    },
  };

  // Unsafe, but we promise, that all fields will be filled
  // and undefined fields will be not used on initialization
  const appContext = initialAppContext as AppContext;

  appContext.database = createDatabase({appContext});
  appContext.translations = createTranslations({appContext});

  const bot = createTelegrafBot(appContext);
  appContext.telegrafBot = bot;

  initBotMiddlewaresEngine(appContext);

  const {onShutdown: reportedShutdown} = initReporter(appContext);

  appContext.init = async () => {
    await appContext.database.init();
    await appContext.translations.init({appContext});
  };

  appContext.stop = async () => {
    await shutdownHandlers.reduceRight((acc, handler) => {
      return acc.finally(() =>
        handler().catch((error) => {
          logger.error('shutdownHandler', undefined, {error});
          return Promise.resolve();
        }),
      );
    }, Promise.resolve());

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
