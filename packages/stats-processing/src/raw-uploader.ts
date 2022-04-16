import {ClickHouse} from 'clickhouse';
import {AsyncBatcher} from '@sesuritu/util/src/async/batch';
import {createLinesStream} from '@sesuritu/util/src/stream/lines-stream';
import {rawLogTableRow, RAW_LOGS_TABLE_NAME} from './queries/tables';

process.stdin.setEncoding('utf8');

(async () => {
  const linesStream = createLinesStream({
    stream: process.stdin,
  }).getGenerator();

  const clickhouse = new ClickHouse({
    url: 'http://localhost',
    port: 8123,
  });

  let batchError: unknown | undefined;

  const batcher = new AsyncBatcher<string>({
    maxItems: 1000,
    delayMs: 5000,
    handle: async (items) => {
      const ws = clickhouse
        .insert(`INSERT INTO ${RAW_LOGS_TABLE_NAME}`)
        .stream();

      for (const log of items) {
        await ws.writeRow(
          rawLogTableRow({
            log,
          }),
        );
      }

      const result = await ws.exec();
      if ((result as {r: number}).r !== 1) {
        throw new Error('Insert failed');
      }
    },
    handleError: (error) => {
      batchError = error;
    },
  });

  for await (const line of linesStream) {
    await batcher.batch(line);

    if (batchError) {
      throw batchError;
    }
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
