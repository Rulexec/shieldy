export const getOrCreateMap = <A, B, C>(
  map: Map<A, Map<B, C>>,
  key: A,
): Map<B, C> => {
  let item = map.get(key);
  if (!item) {
    item = new Map();
    map.set(key, item);
  }

  return item;
};

export const getOrCreateSet = <A, B>(map: Map<A, Set<B>>, key: A): Set<B> => {
  let item = map.get(key);
  if (!item) {
    item = new Set();
    map.set(key, item);
  }

  return item;
};
