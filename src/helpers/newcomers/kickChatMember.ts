import {User} from 'telegraf/typings/telegram-types';
import {Chat} from '@models/Chat';
import {addKickedUser} from '@helpers/newcomers/addKickedUser';
import {AppContext} from '@root/types/app-context';
import {removeCandidates, removeRestrictedUsers} from '../restrictedUsers';
import {KickReason} from '@root/types/telegram/kick-reason';

export async function botKickChatMember({
  appContext,
  chat,
  user,
  reason,
}: {
  appContext: AppContext;
  chat: Chat;
  user: User;
  reason: KickReason;
}): Promise<void> {
  const {
    telegrafBot: {telegram},
    logger,
    report,
  } = appContext;

  logger.info('kick', {
    fn: 'botKickChatMember',
    reason,
    chatId: chat.id,
    userId: user.id,
    userName: user.username,
  });

  // Try kicking the member
  try {
    await addKickedUser(appContext, chat, user.id);
    await telegram.kickChatMember(
      chat.id,
      user.id,
      chat.banUsers ? 0 : Math.floor(new Date().getTime() / 1000 + 45),
    );
  } catch (err) {
    report(err);
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
