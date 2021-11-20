import {AppContext} from '@root/types/app-context';
import {botDeleteMessageSafe} from './deleteMessageSafe';

export async function removeCappedMessagesFromUser({
  appContext,
  chatId,
  fromId,
}: {
  appContext: AppContext;
  chatId: number;
  fromId: number;
}): Promise<void> {
  const messages = await appContext.database.findCappedMessages({
    chat_id: chatId,
    from_id: fromId,
  });
  messages.forEach(async (message) => {
    await botDeleteMessageSafe(appContext, {
      chatId: chatId,
      messageId: message.message_id,
    });
  });
}
