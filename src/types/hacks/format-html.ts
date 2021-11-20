import {Markup} from 'telegraf';
import {MessageEntity} from 'telegram-typings';

export function formatHTML(
  html: string,
  entities?: Array<MessageEntity>,
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Markup.formatHTML(html, entities as any);
}
