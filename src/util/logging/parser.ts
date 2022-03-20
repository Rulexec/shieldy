import {letterToLogLevel, LogLevel} from '@root/types/logging';
import {unescapeExtra, unescapeKey, unescapePropKey} from './logger';

export const parseLogLine = (
  line: string,
): {
  logLevel: LogLevel;
  timestampMilliseconds: number;
  timestampMicroseconds: number;
  loggerKey: string;
  logKey: string;
  props: Map<string, string>;
  extra: string[];
} => {
  const match =
    /^(T|I|W|E|S) (\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{1,3}Z)\.(\d{1,3}) ((?:\\ |[^\s])+) ((?:\\ |[^\s])+)(.*)/.exec(
      line,
    );

  if (!match) {
    throw new Error('Log line not parsed');
  }

  const [
    ,
    levelLetter,
    dateStr,
    microsecondsStr,
    loggerKeyEscaped,
    logKeyEscaped,
    propsAndExtraStr,
  ] = match;

  const logLevel = letterToLogLevel(levelLetter);
  if (!logLevel) {
    throw new Error(`Unknown log level letter: ${levelLetter}`);
  }

  const timestampMilliseconds = new Date(dateStr).getTime();
  const timestampMicroseconds =
    timestampMilliseconds * 1000 + parseInt(microsecondsStr, 10);

  const {props, extra} = parsePropsAndExtra(propsAndExtraStr);

  return {
    logLevel,
    timestampMilliseconds,
    timestampMicroseconds,
    loggerKey: unescapeKey(loggerKeyEscaped),
    logKey: unescapeKey(logKeyEscaped),
    props,
    extra,
  };
};

const getEmptyPropsAndExtra = () => ({props: new Map(), extra: []});

const parsePropsAndExtra = (
  str: string | undefined,
): {props: Map<string, string>; extra: string[]} => {
  if (!str) {
    return getEmptyPropsAndExtra();
  }

  const props = new Map();

  const regexp = /\s((?:\\ |\\:|[^\s:])+):((?:\\ |[^\s])+)/g;
  let lastIndex = 0;

  while (true) {
    const match = regexp.exec(str);
    if (!match) {
      break;
    }

    if (lastIndex !== match.index) {
      throw new Error('Failed to parse props');
    }

    lastIndex = regexp.lastIndex;

    const [, escapedPropKey, escapedValue] = match;

    props.set(unescapePropKey(escapedPropKey), unescapeKey(escapedValue));
  }

  return {
    props,
    extra: parseExtra(str.slice(lastIndex + 1)),
  };
};

const parseExtra = (str: string): string[] => {
  const regexp = /\|((?:\\\||[^|])+)/g;
  let lastIndex = 0;

  const extra: string[] = [];

  while (true) {
    const match = regexp.exec(str);
    if (!match) {
      if (lastIndex !== str.length) {
        throw new Error('Failed to parse extra: chars left');
      }
      break;
    }

    if (lastIndex !== match.index) {
      throw new Error('Failed to parse extra');
    }

    lastIndex = regexp.lastIndex;

    const [, escapedExtra] = match;

    extra.push(unescapeExtra(escapedExtra));
  }

  return extra;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheckLogLevel = (): void => {
  const level: LogLevel = LogLevel.INFO as LogLevel;
  switch (level) {
    case LogLevel.TRACE:
    case LogLevel.INFO:
    case LogLevel.WARNING:
    case LogLevel.ERROR:
    case LogLevel.STATS:
      break;
    default: {
      // If types does not match, fix `parseLogLine` to correctly parse new log level
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const never: never = level;
    }
  }
};
