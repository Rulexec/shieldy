import {Logger} from '../logging/types';

export const logTelegramApiCall = <T>(
  promise: Promise<T>,
  {name, place, rootLogger}: {name: string; place: string; rootLogger: Logger},
): Promise<T> => {
  return promise.then(
    (result) => {
      rootLogger.info(name, {place}, {postfixKey: 'telegram:apiCall'});
      return result;
    },
    (error) => {
      rootLogger.error(name, {place}, {error, postfixKey: 'telegram:apiCall'});
      throw error;
    },
  );
};
