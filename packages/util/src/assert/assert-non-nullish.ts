export function assertNonNullish<T>(value: T): asserts value is NonNullable<T> {
  if (typeof value === 'undefined' || value === null) {
    throw new Error(`assertNonNullish failed, actual value: ${value}`);
  }
}
