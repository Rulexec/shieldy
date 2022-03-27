export type LogFn = (
  key: string,
  props?: Record<string, string | number | boolean | undefined | null>,
  options?: {extra?: any; error?: Error},
) => void;

export type Logger = {
  trace: LogFn;
  info: LogFn;
  warning: LogFn;
  error: LogFn;
  stats: LogFn;
};
