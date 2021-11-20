import {Chat} from '@models/Chat';
import {AppContext} from '@root/types/app-context';

export async function addKickedUser(
  appContext: AppContext,
  chat: Chat,
  userId: number,
): Promise<void> {
  if (!chat.deleteEntryOnKick) {
    return;
  }
  await appContext.database.addKickedUser({chatId: chat.id, userId});
}
