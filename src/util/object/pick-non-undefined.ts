type PickNonUndefined<Type> = {
  [Property in keyof Type as Exclude<
    Property,
    undefined extends Type[Property] ? Property : never
  >]: Type[Property];
};

export const pickNonUndefined = <T>(obj: T): PickNonUndefined<T> => {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'undefined') {
      continue;
    }

    result[key] = value;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return result;
};
