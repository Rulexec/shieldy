import {Logger} from '../logging/types';
import type {StatsDistributionLogger as StatsDistributionLoggerType} from './types';

type LogStatsFn = (stats: Record<string, number>) => void;

export type StatsDistributionLoggerOptions = {
  logStats: LogStatsFn;
  logEveryMs?: number;
  maxLogEveryMs?: number;
  minCount?: number;
  maxCount?: number;
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export class StatsDistributionLogger implements StatsDistributionLoggerType {
  private logStats: LogStatsFn;
  private values: number[] = [];
  private cleanups: (() => void)[] = [];
  private maxCount = Infinity;
  private prevLogHrtime: [number, number];

  constructor({
    logStats,
    logEveryMs = FIVE_MINUTES_MS,
    maxLogEveryMs = HOUR_MS,
    minCount = 100,
    maxCount = 100000,
  }: StatsDistributionLoggerOptions) {
    this.logStats = logStats;
    this.maxCount = maxCount;

    this.prevLogHrtime = process.hrtime();

    const logIntervalId = setInterval(() => {
      if (this.values.length >= minCount) {
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
    this.values.push(value);

    console.log('collect', this.values);

    if (this.values.length >= this.maxCount) {
      this.doLog();
    }
  };

  collectDuration = (): (() => void) => {
    const start = process.hrtime();

    return () => {
      const diff = process.hrtime(start);
      const ms = Math.floor(diff[0] / 1000 + diff[1] / 1000000);

      this.collect(ms);
    };
  };

  private doLog = () => {
    const values = this.values;
    this.values = [];

    if (!values.length) {
      this.logStats({count: 0});
      return;
    }

    const sortedArray = values.sort((a, b) => a - b);
    const sum = sortedArray.reduce((a, b) => a + b);
    const count = sortedArray.length;

    const now = process.hrtime();
    const elapsed = [
      now[0] - this.prevLogHrtime[0],
      now[1] - this.prevLogHrtime[1],
    ];
    const elapsedMs = Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000);
    this.prevLogHrtime = now;

    this.logStats({
      count,
      p0: sortedArray[0],
      p25: calcPercentile(sortedArray, 0.25),
      p50: calcPercentile(sortedArray, 0.5),
      p75: calcPercentile(sortedArray, 0.75),
      p90: calcPercentile(sortedArray, 0.9),
      p95: calcPercentile(sortedArray, 0.95),
      p100: sortedArray[count - 1],
      avg: sum / count,
      ms: elapsedMs,
    });
  };
}

const calcPercentile = (sortedArray: number[], p: number): number => {
  const l = sortedArray.length - 1;
  const n = Math.max(0, Math.min(l, Math.floor(l * p)));
  const n2 = Math.max(0, Math.min(l, Math.ceil(l * p)));

  const a = sortedArray[n];
  const b = sortedArray[n2];

  return a + (b - a) / 2;
};

export const createDistributionStatsLogger = ({
  name,
  logger,
  ...rest
}: {
  name: string;
  logger: Logger;
} & Omit<
  StatsDistributionLoggerOptions,
  'logStats'
>): StatsDistributionLoggerType => {
  return new StatsDistributionLogger({
    ...rest,
    logStats: logger.stats.bind(logger, name),
  });
};
