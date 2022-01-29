export type ExplicitPartial<T> = {[P in keyof T]: T[P] | undefined};
