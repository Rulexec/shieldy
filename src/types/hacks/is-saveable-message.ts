// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function isSaveableMessage(message: any): boolean {
  if (message && message.message_id && message.from?.id && message.chat.id) {
    if (
      (message.entities && message.entities.length) ||
      (message.caption_entities && message.caption_entities.length) ||
      message.forward_from ||
      message.forward_date ||
      message.forward_from_chat ||
      message.document ||
      message.sticker ||
      message.photo ||
      message.video_note ||
      message.video ||
      message.game
    ) {
      return true;
    }
  }

  return false;
}
