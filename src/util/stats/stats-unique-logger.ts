import {Logger} from '../logging/types';
import type {StatsUniqueLogger as StatsUniqueLoggerType} from './types';

type LogStatsFn = (stats: Record<string, number>) => void;

export type StatsUniqueLoggerOptions = {
  logStats: LogStatsFn;
  logEveryMs?: number;
  maxLogEveryMs?: number;
  minCount?: number;
  maxCount?: number;
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export class StatsUniqueLogger implements StatsUniqueLoggerType {
  private logStats: LogStatsFn;
  private valuesSet = new Set<number | string>();
  private cleanups: (() => void)[] = [];
  private maxCount = Infinity;
  private prevLogHrtime: [number, number];

  constructor({
    logStats,
    logEveryMs = FIVE_MINUTES_MS,
    maxLogEveryMs = HOUR_MS,
    minCount = 100,
    maxCount = 100000,
  }: StatsUniqueLoggerOptions) {
    this.logStats = logStats;
    this.maxCount = maxCount;

    this.prevLogHrtime = process.hrtime();

    const logIntervalId = setInterval(() => {
      if (this.valuesSet.size >= minCount) {
        this.doLog();
      }
    }, logEveryMs);

    const forceLogIntervalId = setInterval(() => {
      this.doLog();
    }, maxLogEveryMs);

    this.cleanups.push(() => {
      clearInterval(logIntervalId);
      clearInterval(forceLogIntervalId);
    });
  }

  destroy = (): void => {
    while (this.cleanups.length) {
      this.cleanups.pop()!();
    }
  };

  collect = (value: number): void => {
    this.valuesSet.add(value);

    if (this.valuesSet.size >= this.maxCount) {
      this.doLog();
    }
  };

  private doLog = () => {
    const values = this.valuesSet;

    const count = values.size;

    if (!count) {
      this.logStats({count: 0});
      this.valuesSet.clear();
      return;
    }

    const now = process.hrtime();
    const elapsed = [
      now[0] - this.prevLogHrtime[0],
      now[1] - this.prevLogHrtime[1],
    ];
    const elapsedMs = Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000);
    this.prevLogHrtime = now;

    this.logStats({
      count,
      ms: elapsedMs,
    });
  };
}

export const createStatsUniqueLogger = ({
  name,
  logger,
  ...rest
}: {
  name: string;
  logger: Logger;
} & Omit<StatsUniqueLoggerOptions, 'logStats'>): StatsUniqueLoggerType => {
  return new StatsUniqueLogger({
    ...rest,
    logStats: logger.stats.bind(logger, name),
  });
};
