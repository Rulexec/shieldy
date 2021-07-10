import {Context} from '@root/types/context';

export function getMessageText(context: Context): string | undefined {
  const message = context.update.message;
  if (!message) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (message as any).text;
  if (typeof text !== 'string') {
    return;
  }

  return text;
}

export function getReplyToMessageText(context: Context): string | undefined {
  const message = context.message?.reply_to_message;
  if (!message) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (message as any).text;
  if (typeof text !== 'string') {
    return;
  }

  return text;
}
