import {Chat} from '@sesuritu/types/src/models/Chat';
import {IdlingStatus} from '@sesuritu/util/src/state/idling-status';
import {Bot} from '@sesuritu/types/src/bot';
import {Database} from '@sesuritu/types/src/database';
import {LogLevel} from '@sesuritu/types/src/logging';
import {TelegramApi} from '@sesuritu/types/src/telegram/telegram-api';
import {BotMiddlewareFn} from './bot';
import {Logger} from '@sesuritu/util/src/logging/logger';
import type {ITranslations} from './i18n/translations';
import {CommandDef} from './commands/command-def';

export type Config = {
  workersCount: number;
  telegramToken: string;
  telegramAdminId: number;
  telegramAdminNickName?: string;
  telegramApiRoot: string;
  telegramPollingInterval: number;
  mongoUri: string;
  /** @deprecated */
  withPromo: boolean;
  l10nFilesPath: string;
  logLevel: LogLevel;
};

export type AppContext = {
  isWorker: boolean;
  init: () => Promise<void>;
  stop: () => Promise<void>;
  run: (fun: () => void | Promise<void>) => void;
  logger: Logger;
  config: Config;
  translations: ITranslations;
  database: Database;
  telegrafBot: Bot;
  telegramApi: TelegramApi;
  commandDefinitions: CommandDef[];
  addBotCommand: (
    command: string | string[],
    ...middlewares: BotMiddlewareFn[]
  ) => void;
  addBotCallbackQuery: (
    query: string | string[] | RegExp,
    ...middlewares: BotMiddlewareFn[]
  ) => void;
  prependBotMiddleware: (middleware: BotMiddlewareFn) => void;
  addBotMiddleware: (middleware: BotMiddlewareFn) => void;
  onShutdown: (handler: () => Promise<void>) => void;
  /** @deprecated just use logger */
  report: (error: Error, reason?: string) => void;
  createDefaultChat: (id: number) => Chat;
  getCurrentDate: () => Date;
  idling: IdlingStatus;
};

// Used to validate correctness of `createContext()` at runtime
// WARN: type checks that there is now unexisting keys, not that it missing some keys
export const appContextKeys: (keyof AppContext)[] = [
  'init',
  'stop',
  'run',
  'logger',
  'config',
  'database',
  'telegrafBot',
  'telegramApi',
  'addBotMiddleware',
  'report',
  'createDefaultChat',
  'getCurrentDate',
  'idling',
];
