interface Array<T> {
  filter(
    predicate: BooleanConstructor,
    thisArg?: any,
  ): Exclude<T, null | undefined | false>[];
}
