export const isEmptyObject = (obj: Record<string, unknown>): boolean => {
  return Boolean(Object.keys(obj).length);
};
