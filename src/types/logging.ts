export enum LogLevel {
  TRACE = 1,
  INFO = 2,
  WARNING = 3,
  ERROR = 4,
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
