import {cpus} from 'os';

import * as dotenv from 'dotenv';

import {logLevelNameToLevel} from './types/logging';
import {Config} from './types/app-context';

// TODO: do not pollute `process.env`
dotenv.config({path: `${__dirname}/../.env`});

export function getConfig(): Config {
  let workersCount = parseInt(String(process.env.WORKERS_COUNT), 10);
  if (!isFinite(workersCount)) {
    workersCount = cpus().length;
  }

  let firstError: Error | undefined;

  const config: Config = {
    workersCount,
    telegramApiRoot: 'https://api.telegram.org',
    telegramToken: ensureEnv('TOKEN'),
    telegramAdminId: parseInt(String(process.env.ADMIN), 10),
    telegramAdminNickName: process.env.ADMIN_NICK,
    telegramPollingInterval: 30,
    mongoUri: ensureEnv('MONGO'),
    withPromo: process.env.PROMO_DISABLED !== '1',
    l10nFilesPath: process.env.L10N_PATH || `${__dirname}/../l10n`,
    logLevel: logLevelNameToLevel(process.env.LOG_LEVEL),
    isNeedUpdateAutocomplete: process.env.NO_NEED_UPDATE_AUTOCOMPLETE !== '1',
  };

  if (firstError) {
    throw firstError;
  }

  return config;

  function ensureEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      if (!firstError) {
        firstError = new Error(`${name} environment variable absent`);
      }

      process.stderr.write(`Specify ${name} env variable\n`);

      return '';
    }

    return value;
  }
}
