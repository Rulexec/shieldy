export enum LogLevel {
  TRACE = 1,
  INFO = 2,
  WARNING = 3,
  ERROR = 4,
  STATS = 5,
}

export function logLevelNameToLevel(name = ''): LogLevel {
  return (
    {
      trace: LogLevel.TRACE,
      info: LogLevel.INFO,
      warn: LogLevel.WARNING,
      warning: LogLevel.WARNING,
      error: LogLevel.ERROR,
    }[name.toLowerCase()] || LogLevel.TRACE
  );
}

export const logLevelToLetter = (level: LogLevel): string => {
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

export const letterToLogLevel = (letter: string): LogLevel | undefined => {
  switch (letter) {
    case 'T':
      return LogLevel.TRACE;
    case 'I':
      return LogLevel.INFO;
    case 'W':
      return LogLevel.WARNING;
    case 'E':
      return LogLevel.ERROR;
    case 'S':
      return LogLevel.STATS;
    default:
      return undefined;
  }
};
