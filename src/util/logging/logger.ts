import {LogLevel} from '@root/types/logging';
import type {
  LogFnOptions,
  LogFnProps,
  Logger as LoggerInterface,
} from './types';

type LoggerWithFork = LoggerInterface & {fork: (key: string) => LoggerWithFork};
type LogFn = (
  loggerOpts: {loggerKey?: string; level: LogLevel},
  key: string,
  props?: LogFnProps,
  extra?: LogFnOptions,
) => void;
type FilterLogFn = (...params: Parameters<LogFn>) => boolean;

const getTrue = () => true;

export class Logger implements LoggerInterface {
  private lastTimeMs = 0;
  private microTicks = 0;
  private key: string;
  private logLevel: LogLevel;
  private filterLog: FilterLogFn = getTrue;

  constructor(
    key: string,
    {
      logLevel = LogLevel.TRACE,
      filter,
    }: {logLevel?: LogLevel; filter?: FilterLogFn} = {},
  ) {
    this.key = key;
    this.logLevel = logLevel;

    if (filter) {
      this.filterLog = filter;
    }
  }

  private log: LogFn = (
    loggerOpts: {loggerKey?: string; level: LogLevel},
    key: string,
    props?: Record<string, string | number | boolean | undefined | null>,
    extraOpts = {},
  ): void => {
    const {loggerKey = this.key, level} = loggerOpts;
    const {extra, error, postfixKey} = extraOpts;

    if (
      level < this.logLevel ||
      !this.filterLog(loggerOpts, key, props, extraOpts)
    ) {
      return;
    }

    let ms = Date.now();

    if (this.lastTimeMs >= ms) {
      this.microTicks++;
      if (this.microTicks >= 1000) {
        this.microTicks = 0;
        ms++;
      }
    } else {
      this.microTicks = 0;
    }

    this.lastTimeMs = ms;

    const logString = `${levelToLetter(level)} ${new Date(
      ms,
    ).toISOString()}.${String(this.microTicks).padStart(3, '0')} ${escapeKey(
      `${loggerKey}${postfixKey ? `:${postfixKey}` : ''}`,
    )} ${escapeKey(key)} ${props ? propsToStringWithSpaceAfter(props) : ''}${
      error ? `|${exceptionToString(error)}` : ''
    }${extra ? `|${extraToString(extra)}` : ''}\n`;

    process.stdout.write(logString);
  };

  trace: LoggerInterface['trace'] = this.log.bind(this, {
    loggerKey: undefined,
    level: LogLevel.TRACE,
  });
  info: LoggerInterface['info'] = this.log.bind(this, {
    loggerKey: undefined,
    level: LogLevel.INFO,
  });
  warning: LoggerInterface['warning'] = this.log.bind(this, {
    loggerKey: undefined,
    level: LogLevel.WARNING,
  });
  error: LoggerInterface['error'] = this.log.bind(this, {
    loggerKey: undefined,
    level: LogLevel.ERROR,
  });
  stats: LoggerInterface['stats'] = this.log.bind(this, {
    loggerKey: undefined,
    level: LogLevel.STATS,
  });

  fork = (key: string): LoggerWithFork => {
    const constructFork = (key: string): LoggerWithFork => {
      return {
        trace: this.log.bind(this, {
          loggerKey: `${this.key}:${key}`,
          level: LogLevel.TRACE,
        }),
        info: this.log.bind(this, {
          loggerKey: `${this.key}:${key}`,
          level: LogLevel.INFO,
        }),
        warning: this.log.bind(this, {
          loggerKey: `${this.key}:${key}`,
          level: LogLevel.WARNING,
        }),
        error: this.log.bind(this, {
          loggerKey: `${this.key}:${key}`,
          level: LogLevel.ERROR,
        }),
        stats: this.log.bind(this, {
          loggerKey: `${this.key}:${key}`,
          level: LogLevel.STATS,
        }),
        fork: (nextKey) => {
          return constructFork(`${this.key}:${key}:${nextKey}`);
        },
      };
    };

    return constructFork(key);
  };

  getKey(): string {
    return this.key;
  }

  setKey = (key: string): void => {
    this.key = key;
  };
}

const propsToStringWithSpaceAfter = (
  props: Record<string, string | number | boolean | undefined | null>,
): string => {
  let result = '';

  for (const [key, value] of Object.entries(props)) {
    result += `${escapePropKey(key)}:${escapeKey(String(value))} `;
  }

  return result;
};

const exceptionToString = (error: Error): string => {
  if (error.stack) {
    return escapeExtra(error.stack);
  }

  return escapeExtra(error.toString());
};

const extraToString = (extra: any): string => {
  return escapeExtra(JSON.stringify(extra));
};

const escapePropKey = (key: string): string => {
  return key.replace(/(?=\\|\s|:)()/g, '\\$1');
};

const escapeKey = (key: string): string => {
  return key.replace(/(?=\\|\s)()/g, '\\$1');
};

const escapeExtra = (text: string): string => {
  return text
    .replace(/(?=\\|\|)()/g, '\\$1')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
};

const levelToLetter = (level: LogLevel): string => {
  switch (level) {
    case LogLevel.TRACE:
      return 'T';
    case LogLevel.INFO:
      return 'I';
    case LogLevel.WARNING:
      return 'W';
    case LogLevel.ERROR:
      return 'E';
    case LogLevel.STATS:
      return 'S';
    default: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const never: never = level;
      return '?';
    }
  }
};
