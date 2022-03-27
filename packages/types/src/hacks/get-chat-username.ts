import {Context} from '../context';

export function getChatUsername(context: Context): string | undefined {
  const chat = context.chat;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const username = (chat as any).username as unknown;
  if (typeof username !== 'string') {
    return undefined;
  }

  return username;
}
