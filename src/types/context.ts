import {Chat} from '@models/Chat';
import type * as tt from 'telegraf/typings/telegram-types';
import type {Context as TelegrafContext} from 'telegraf/typings/index';
import {AppContext} from './app-context';
import {L10nKey} from '@root/i18n/l10n-key';

export type Context = TelegrafContext & {
  appContext: AppContext;
  dbchat: Chat;
  chatMember?: tt.ChatMember;
  isAdministrator: boolean;

  translate: (key: L10nKey) => string;

  deleteMessageSafe: (options: {
    chatId: number;
    messageId: number;
  }) => Promise<void>;

  replyWithMarkdown(
    markdown: string,
    extra?: tt.ExtraEditMessage | tt.Extra,
  ): Promise<tt.Message>;
};
