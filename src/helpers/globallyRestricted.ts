const globalyRestrictedMap = {} as {[index: number]: boolean};

export function modifyGloballyRestricted(
  ids: number[],
  restrict: boolean,
): void {
  for (const id of ids) {
    globalyRestrictedMap[id] = restrict;
  }
}

export function isGloballyRestricted(id: number): boolean {
  return !!globalyRestrictedMap[id];
}
