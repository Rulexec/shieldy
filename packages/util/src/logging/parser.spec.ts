import {LogLevel} from '@sesuritu/types/src/logging';
import {parseLogLine} from './parser';

describe('parseLogLine', () => {
  it('should parse log without props', () => {
    const {
      logLevel,
      timestampMilliseconds,
      timestampMicroseconds,
      loggerKey,
      logKey,
      extra,
      props,
    } = parseLogLine('T 2022-03-19T22:35:54.190Z.042 test:key someLogKey');

    expect(logLevel).toBe(LogLevel.TRACE);
    expect(new Date(timestampMilliseconds).toISOString()).toBe(
      '2022-03-19T22:35:54.190Z',
    );
    expect(timestampMicroseconds).toBe(
      Date.parse('2022-03-19T22:35:54.190Z') * 1000 + 42,
    );
    expect(loggerKey).toBe('test:key');
    expect(logKey).toBe('someLogKey');
    expect(props.size).toBe(0);
    expect(extra.length).toBe(0);
  });

  it('should parse log with escapes', () => {
    const {logLevel, loggerKey, logKey} = parseLogLine(
      'I 2022-03-19T22:35:54.190Z.042 logger\\ key log\\ key',
    );

    expect(logLevel).toBe(LogLevel.INFO);
    expect(loggerKey).toBe('logger key');
    expect(logKey).toBe('log key');
  });

  it('should parse props', () => {
    const {logLevel, props} = parseLogLine(
      'W 2022-03-19T22:35:54.190Z.042 key key a:1 b:escaped\\ prop c:escaped:prop answer:42',
    );

    expect(logLevel).toBe(LogLevel.WARNING);
    expect(Array.from(props.entries()).sort()).toStrictEqual([
      ['a', '1'],
      ['answer', '42'],
      ['b', 'escaped prop'],
      ['c', 'escaped:prop'],
    ]);
  });

  it('should parse props with extra', () => {
    const {logLevel, props, extra} = parseLogLine(
      'E 2022-03-19T22:35:54.190Z.042 key key a:1 b:2 |extra|space extra|new\\nline\\r\\nextra|escaped\\|extra|final extra',
    );

    expect(logLevel).toBe(LogLevel.ERROR);
    expect(Array.from(props.entries()).sort()).toStrictEqual([
      ['a', '1'],
      ['b', '2'],
    ]);
    expect(extra).toStrictEqual([
      'extra',
      'space extra',
      'new\nline\r\nextra',
      'escaped|extra',
      'final extra',
    ]);
  });
});
