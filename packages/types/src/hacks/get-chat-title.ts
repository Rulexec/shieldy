import {Context} from '../context';

export async function getChatTitle(
  context: Context,
): Promise<string | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chat = (await context.getChat()) as any;

  const title = chat.title;
  if (typeof title !== 'string') {
    return undefined;
  }

  return title;
}
