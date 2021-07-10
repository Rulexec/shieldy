export type InlineKeyboardKey = {text: string; callbackData: string};

export type Message = {
  chatId: number;
  messageId: number;
  text: string;
  replyToMessageId?: number;
  inlineKeyboard?: InlineKeyboardKey[];
  unixSeconds: number;
};

export type MessageEdit = {
  chatId: number;
  messageId: number;
  text: string;
};
