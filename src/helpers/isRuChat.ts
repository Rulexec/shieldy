import {Chat, Language} from '@models/Chat';

export function isRuChat(chat: Chat): boolean {
  return chat.language === Language.RUSSIAN;
}
