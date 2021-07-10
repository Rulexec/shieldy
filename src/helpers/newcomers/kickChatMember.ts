import {User} from 'telegraf/typings/telegram-types';
import {Chat} from '@models/Chat';
import {addKickedUser} from '@helpers/newcomers/addKickedUser';
import {AppContext} from '@root/types/app-context';
import {removeCandidates, removeRestrictedUsers} from '../restrictedUsers';

export async function botKickChatMember(
  appContext: AppContext,
  chat: Chat,
  user: User,
): Promise<void> {
  // Try kicking the member
  try {
    await addKickedUser(appContext, chat, user.id);
    await appContext.telegrafBot.telegram.kickChatMember(
      chat.id,
      user.id,
      chat.banUsers ? 0 : Math.floor(new Date().getTime() / 1000 + 45),
    );
  } catch (err) {
    appContext.report(err);
  }
  // Remove from candidates
  await removeCandidates({
    appContext,
    chat,
    candidatesAndUsers: [user],
  });
  // Remove from restricted
  await removeRestrictedUsers({
    appContext,
    chat,
    candidatesAndUsers: [user],
  });
}
