import {Context} from '@root/types/context';

export function hasNewChatMembers(context: Context): boolean {
  const message = context.update.message;
  if (!message) {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((message as any).new_chat_members);
}
