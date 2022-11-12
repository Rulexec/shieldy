export type LogFnProps = Record<
  string,
  string | number | boolean | undefined | null
>;
export type LogFnOptions = {extra?: any; error?: Error; postfixKey?: string};

export type LogFn = (
  key: string,
  props?: LogFnProps,
  options?: LogFnOptions,
) => void;

export type Logger = {
  trace: LogFn;
  info: LogFn;
  warning: LogFn;
  error: LogFn;
  stats: LogFn;
};
