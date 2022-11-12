import {Logger} from '../logging/types';

export const measureDuration = ({
  name,
  logger,
  props,
}: {
  name: string;
  logger: Logger;
  props?: Record<string, string | number>;
}) => {
  const start = process.hrtime();

  return () => {
    const diff = process.hrtime(start);
    const ms = Math.floor(diff[0] / 1000 + diff[1] / 1000000);

    logger.stats(name, {...props, ms});
  };
};
