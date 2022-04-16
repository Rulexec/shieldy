export const safeAssign = <S, D extends S>(destination: D, source: S): D =>
  Object.assign(destination, source);
