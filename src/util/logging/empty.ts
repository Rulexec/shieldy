import {Logger} from './types';

const noop = () => {
  //
};

export const EMPTY_LOGGER: Logger = {
  trace: noop,
  info: noop,
  warning: noop,
  error: noop,
  stats: noop,
};
