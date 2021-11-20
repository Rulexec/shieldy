import {ExtraSendMessage} from 'telegraf/typings/telegram-types';
import {Message} from 'typegram';
import {Context} from './context';

export type TelegramApi = {
  // Currently just proxy to `context.replyWithMarkdown`
  replyWithMarkdown: (
    context: Context,
    markdown: string,
    extra?: ExtraSendMessage,
  ) => Promise<Message>;
};
