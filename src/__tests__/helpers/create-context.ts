import {ContextOptions, createContext} from '@root/context';
import {MemoryDatabase} from '@root/database/memory/database';
import {Translations} from '@root/i18n/translations';
import {AppContext} from '@sesuritu/types/src/app-context';
import {LogLevel} from '@sesuritu/types/src/logging';
import {Logger} from '@sesuritu/util/src/logging/logger';
import {TEST_TELEGRAM_TOKEN} from '../constants';

type CreateTestAppContextOptions = Partial<{
  telegramApiRoot: string;
  initialTimestamp: number;
}> &
  ContextOptions;

type TestAppContext = {
  appContext: AppContext;
  timestamp: number;
};

export const createTestAppContext = ({
  telegramApiRoot = '',
  initialTimestamp,
  ...rest
}: CreateTestAppContextOptions = {}): TestAppContext => {
  const result: TestAppContext = {
    appContext: null as any as AppContext,
    timestamp: initialTimestamp || Date.now(),
  };

  result.appContext = createContext({
    config: {
      workersCount: 1,
      telegramToken: TEST_TELEGRAM_TOKEN,
      telegramAdminId: 42,
      telegramAdminNickName: 'testadmin',
      telegramApiRoot,
      telegramPollingInterval: 1,
      mongoUri: 'mongonotused',
      withPromo: false,
      logLevel: LogLevel.WARNING,
      l10nFilesPath: '',
    },
    createDatabase: ({appContext}) => new MemoryDatabase({appContext}),
    createTranslations: ({appContext}) =>
      new Translations({
        getTranslationsLoader: () => () =>
          Promise.resolve([{lang: 'en', translations: {}}]),
        logger: appContext.logger.fork('l10n'),
      }),
    getCurrentDate: () => new Date(result.timestamp),
    getLogger: () =>
      new Logger('test', {
        filter: ({loggerKey, level}, key) => {
          if (level === LogLevel.STATS) {
            return false;
          }
          if (
            loggerKey === 'test:l10n' &&
            level === LogLevel.ERROR &&
            key === 'noTranslation'
          ) {
            return false;
          }

          return true;
        },
      }),
    ...rest,
  });

  return result;
};
