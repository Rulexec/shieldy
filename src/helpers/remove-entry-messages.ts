import {AppContext} from '@root/types/app-context';
import {botDeleteMessageSafe} from './deleteMessageSafe';

export async function removeEntryMessagesFromUser({
  appContext,
  chatId,
  fromId,
}: {
  appContext: AppContext;
  chatId: number;
  fromId: number;
}): Promise<void> {
  const messages = await appContext.database.findEntryMessages({
    chat_id: chatId,
    from_id: fromId,
  });
  messages.forEach(async (message) => {
    await botDeleteMessageSafe(appContext, {
      chatId,
      messageId: message.message_id,
    });
    try {
      await appContext.database.deleteEntryMessage(message);
    } catch (err) {
      appContext.report(err);
    }
  });
}
