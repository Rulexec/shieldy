import {Chat, Language} from '@sesuritu/types/src/models/Chat';

export function isRuChat(chat: Chat): boolean {
  return chat.language === Language.RUSSIAN;
}
