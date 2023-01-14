import {Chat} from '@root/models/Chat';
import {IdlingStatus} from '@root/util/state/idling-status';
import {Bot} from './bot';
import {Database} from './database';
import {LogLevel} from './logging';
import {TelegramApi} from './telegram/telegram-api';
import {BotMiddlewareFn} from '@root/bot/types';
import {Logger} from '@root/util/logging/logger';
import {Translations} from '@root/i18n/translations';
import {CommandDef} from '@root/commands/all-commands';

export type Config = {
  workersCount: number;
  telegramToken: string;
  telegramAdminId: number;
  telegramAdminNickName?: string;
  telegramApiRoot: string;
  telegramPollingInterval: number;
  mongoUri: string;
  database: 'mongo' | 'memory';
  memoryDatabaseDumpPath?: string;
  isNeedUpdateAutocomplete: boolean;
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
  translations: Translations;
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
