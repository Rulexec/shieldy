import {isGroup} from '@helpers/isGroup';
import {Context} from 'telegraf';

export function checkIfGroup(ctx: Context, next: () => void): void {
  if (!isGroup(ctx)) {
    return;
  }
  return next();
}
