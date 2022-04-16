export const STATS_DISTRIBUTION_TABLE_NAME = 'stats_distribution';
export const STATS_DISTRIBUTION_TABLE_QUERY = `
  CREATE TABLE IF NOT EXISTS ${STATS_DISTRIBUTION_TABLE_NAME} (
    time Datetime64(6, 0),
    source String,
    key String,
    count UInt32,
    p0 Float32 DEFAULT 0,
    p25 Float32 DEFAULT 0,
    p50 Float32 DEFAULT 0,
    p75 Float32 DEFAULT 0,
    p90 Float32 DEFAULT 0,
    p95 Float32 DEFAULT 0,
    p100 Float32 DEFAULT 0,
    avg Float32 DEFAULT 0,
    ms Float32 DEFAULT 0
  ) ENGINE = MergeTree()
  ORDER BY time
`;
export const statsDistributionTableRow = ({
  time,
  source,
  key,
  count,
  p0,
  p25,
  p50,
  p75,
  p90,
  p95,
  p100,
  avg,
  ms,
}: {
  time: string;
  source: string;
  key: string;
  count: number;
  p0: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p100: number;
  avg: number;
  ms: number;
}) => {
  return [time, source, key, count, p0, p25, p50, p75, p90, p95, p100, avg, ms];
};

export const RAW_LOGS_TABLE_NAME = 'raw_logs';
export const RAW_LOGS_TABLE_QUERY = `
  CREATE TABLE IF NOT EXISTS ${RAW_LOGS_TABLE_NAME} (
    log String
  ) ENGINE = MergeTree()
  ORDER BY log
  PRIMARY KEY log
`;
export const rawLogTableRow = ({log}: {log: string}) => {
  return [log];
};
