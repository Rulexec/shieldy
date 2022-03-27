export type IsEqual<A, B> = A extends B ? (B extends A ? true : never) : never;
export type IsEqualT<A, B> = A extends B ? (B extends A ? A : never) : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assertTypesEqual = <A, B>(proof: IsEqual<A, B>): void => {
  //
};
