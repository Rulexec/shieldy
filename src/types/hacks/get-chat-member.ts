import {ChatMember, Update} from 'telegraf/typings/telegram-types';

export type ChatMemberWrapper = {
  from: {
    id: number;
  };
  old_chat_member: ChatMember;
  new_chat_member: ChatMember;
};
export function getChatMember(update: Update): ChatMemberWrapper | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyUpdate = update as any;
  const chatMember = anyUpdate.chat_member;

  if (!chatMember) {
    return;
  }

  return {
    from: chatMember.from,
    old_chat_member: chatMember.old_chat_member as ChatMember,
    new_chat_member: chatMember.new_chat_member as ChatMember,
  };
}
