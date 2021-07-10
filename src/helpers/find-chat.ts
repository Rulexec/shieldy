import {Chat} from '@root/models/Chat';
import {AppContext} from '@root/types/app-context';

export async function findChatById(
  appContext: AppContext,
  id: number,
): Promise<Chat> {
  let chat = await appContext.database.getChatById(id);

  if (!chat) {
    chat = appContext.createDefaultChat(id);
    await appContext.database.updateChat(chat);
  }

  return chat;
}
