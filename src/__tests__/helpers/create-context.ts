import {createContext} from '@root/context';
import {MemoryDatabase} from '@root/database/memory/database';
import {AppContext} from '@root/types/app-context';
import {LogLevel} from '@root/types/logging';
import {TEST_TELEGRAM_TOKEN} from '../constants';

type CreateTestAppContextOptions = Partial<{
  telegramApiRoot: string;
  initialTimestamp: number;
}>;

type TestAppContext = {
  appContext: AppContext;
  timestamp: number;
};

export const createTestAppContext = ({
  telegramApiRoot = '',
  initialTimestamp,
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
    getCurrentDate: () => new Date(result.timestamp),
  });

  return result;
};
