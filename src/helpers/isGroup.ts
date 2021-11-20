import {Context} from 'telegraf';
export function isGroup(ctx: Context): boolean {
  const chatType = ctx.chat?.type;
  if (!chatType) {
    return false;
  }

  return ['group', 'supergroup'].includes(chatType);
}
