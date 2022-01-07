import {getUniqueCounterValue} from '@root/util/id/unique-counter';
import {Chat, User} from './chats';
import {Message} from './types';

export const createMessage = ({
  user,
  chat,
  unixSeconds,
  text,
  updateId,
  messageId,
  replyToMessage,
  isBotCommand = false,
}: {
  user: User;
  chat: Chat;
  unixSeconds: number;
  text: string;
  updateId?: number;
  messageId?: number;
  replyToMessage?: {message: Message; user: User};
  isBotCommand?: boolean;
}): any => {
  return {
    update_id: updateId || getUniqueCounterValue(),
    message: {
      message_id: messageId || getUniqueCounterValue(),
      reply_to_message:
        replyToMessage &&
        createMessage({
          chat,
          user: replyToMessage.user,
          unixSeconds: replyToMessage.message.unixSeconds,
          text: replyToMessage.message.text,
          messageId: replyToMessage.message.messageId,
        }).message,
      from: user,
      chat,
      date: unixSeconds,
      text,
      entities: isBotCommand
        ? [
            {
              offset: 0,
              length: text.length,
              type: 'bot_command',
            },
          ]
        : [],
    },
  };
};

export const createCallbackQuery = ({
  user,
  message,
  data,
  updateId = 1,
  callbackQueryId = '1',
  chatInstance = '1',
}: {
  user: User;
  message: any;
  data: string;
  updateId?: number;
  callbackQueryId?: string;
  chatInstance?: string;
}): any => {
  return {
    update_id: updateId,
    callback_query: {
      id: callbackQueryId,
      from: user,
      message,
      chat_instance: chatInstance,
      data,
    },
  };
};

type ChatMemberStatusType = 'left' | 'member';

type ChatMemberStatus = {
  user: User;
  status: ChatMemberStatusType;
};

export const createChatMemberChange = ({
  user,
  chat,
  unixSeconds,
  updateId = 1,
  fromStatus,
  toStatus,
}: {
  user: User;
  chat: Chat;
  messageId?: number;
  updateId?: number;
  unixSeconds: number;
  fromStatus: ChatMemberStatusType;
  toStatus: ChatMemberStatusType;
}): {
  update_id: number;
  chat_member: {
    from: User;
    chat: Chat;
    date: number;
    old_chat_member: ChatMemberStatus;
    new_chat_member: ChatMemberStatus;
  };
} => {
  return {
    update_id: updateId,
    chat_member: {
      chat: chat,
      from: user,
      date: unixSeconds,
      old_chat_member: {
        user: user,
        status: fromStatus,
      },
      new_chat_member: {
        user: user,
        status: toStatus,
      },
    },
  };
};

export const createNewChatMemberMessage = ({
  user,
  chat,
  unixSeconds,
  messageId,
  updateId,
}: {
  user: User;
  chat: Chat;
  messageId?: number;
  updateId?: number;
  unixSeconds: number;
}): {
  update_id: number;
  message: {
    message_id: number;
    from: User;
    chat: Chat;
    date: number;
    new_chat_participant: User;
    new_chat_member: User;
    new_chat_members: User[];
  };
} => {
  return {
    update_id: updateId || getUniqueCounterValue(),
    message: {
      message_id: messageId || getUniqueCounterValue(),
      from: user,
      chat: chat,
      date: unixSeconds,
      new_chat_participant: user,
      new_chat_member: user,
      new_chat_members: [user],
    },
  };
};
