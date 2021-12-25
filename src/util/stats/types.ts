export type StatsDistributionLogger = {
  collect: (value: number) => void;
  collectDuration: () => () => void;
};
