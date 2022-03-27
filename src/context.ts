import {Database} from '@sesuritu/types/src/database';
import {appContextKeys, Config} from '@sesuritu/types/src/app-context';
import {getConfig} from './config';
import {MongoDatabase} from './database/mongo/database';
import {createTelegrafBot} from './helpers/bot';
import {createDefaultChat} from './helpers/create-default-chat';
import {initReporter} from './helpers/report';
import {AppContext} from '@sesuritu/types/src/app-context';
import {IdlingStatus} from '@sesuritu/util/src/state/idling-status';
import {initBotMiddlewaresEngine} from './bot/bot';
import {Logger} from '@sesuritu/util/src/logging/logger';
import {Translations} from './i18n/translations';
import {createFsPoTranslationsLoader} from './i18n/translations-loader-fs-po';
import {getCommands} from './commands/all-commands';
import {ExplicitPartial} from '@sesuritu/types/src/utility';
import {toDoValidateResponse} from '@sesuritu/types/src/hacks/to-do-validate';

export type ContextOptions = Partial<{
  isWorker: boolean;
  instanceId: string;
  config: Config;
  createDatabase: (options: {appContext: AppContext}) => Database;
  createTranslations: (options: {appContext: AppContext}) => Translations;
  getCurrentDate: () => Date;
  getLogger: (options: {name: string; config: Config}) => Logger;
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
  getLogger = ({name, config}) => new Logger(name, {logLevel: config.logLevel}),
}: ContextOptions = {}): AppContext {
  const idling = new IdlingStatus();
  const config = customConfig || getConfig();
  const logger = getLogger({name: instanceId || 'main', config});

  const shutdownHandlers: (() => Promise<void>)[] = [];

  let appContext: AppContext = undefined as unknown as AppContext;

  const initialAppContext: ExplicitPartial<AppContext> = {
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
      sendMessage: (options) => {
        return idling.wrapTask(() =>
          toDoValidateResponse(
            appContext.telegrafBot.telegram.callApi('sendMessage', options),
          ),
        );
      },
    },
    commandDefinitions: getCommands(),
    translations: undefined,
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
  appContext = initialAppContext as AppContext;

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
