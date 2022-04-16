import {ClickHouse} from 'clickhouse';
import {
  RAW_LOGS_TABLE_QUERY,
  STATS_DISTRIBUTION_TABLE_QUERY,
} from './queries/tables';

const main = async () => {
  const clickhouse = new ClickHouse({
    url: 'http://localhost',
    port: 8123,
  });

  const executeQueryR = async (query: string) => {
    const result = (await clickhouse.query(query).toPromise()) as unknown as {
      r: number;
    };

    if (result.r !== 1) {
      throw new Error(`Query failed: ${query}`);
    }
  };

  await executeQueryR(STATS_DISTRIBUTION_TABLE_QUERY);
  await executeQueryR(RAW_LOGS_TABLE_QUERY);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
