export type StatsDistributionLogger = {
  collect: (value: number) => void;
  collectDuration: () => () => void;
};

export type StatsUniqueLogger = {
  collect: (value: number | string) => void;
};
