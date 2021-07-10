import {Context} from '@root/types/context';
import {hasNewChatMembers} from '@root/types/hacks/get-new-chat-members';
import {isSaveableMessage} from '@root/types/hacks/is-saveable-message';

// Needed for `removeCappedMessagesFromUser`
export function messageSaver(ctx: Context, next: () => void): void {
  try {
    const message = ctx.update.edited_message || ctx.update.message;
    if (isSaveableMessage(message)) {
      saveMessage(ctx);
    }
  } catch {
    // Do nothing
  }
  return next();
}

function saveMessage(ctx: Context): void {
  if (hasNewChatMembers(ctx)) {
    return;
  }
  const message = ctx.update.edited_message || ctx.update.message;

  ctx.appContext.database
    .addCappedMessage({
      message_id: message.message_id,
      from_id: message.from.id,
      chat_id: message.chat.id,
      createdAt: new Date(),
    })
    .catch(ctx.appContext.report);
}
