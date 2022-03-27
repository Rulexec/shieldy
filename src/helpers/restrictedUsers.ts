import {Chat, Candidate} from '@sesuritu/types/src/models/Chat';
import {AppContext} from '@sesuritu/types/src/app-context';
import {User} from 'telegraf/typings/telegram-types';

enum RestrictedUsersModificationType {
  ADD = 'add',
  REMOVE = 'remove',
}
enum RestrictedUsersType {
  CANDIDATES = 'candidates',
  RESTRICTED_USERS = 'restricted_users',
}
type BotModifyRestrictedUsersOptions = {
  appContext: AppContext;
  chat: Chat;
  type: RestrictedUsersType;
  actionType: RestrictedUsersModificationType;
  updateRestrictedTime?: boolean;
  candidatesAndUsers: Array<Candidate | Pick<User, 'id'>>;
};
async function botModifyRestrictedUsers({
  appContext,
  chat,
  type,
  actionType,
  updateRestrictedTime = false,
  candidatesAndUsers,
}: BotModifyRestrictedUsersOptions): Promise<void> {
  if (!candidatesAndUsers.length) {
    return;
  }

  const {addMethod, removeMethod} =
    type === RestrictedUsersType.RESTRICTED_USERS
      ? {
          addMethod: appContext.database.addChatRestrictedUsers,
          removeMethod: appContext.database.removeChatRestrictedUsers,
        }
      : {
          addMethod: appContext.database.addChatCandidates,
          removeMethod: appContext.database.removeChatCandidates,
        };

  try {
    if (actionType === RestrictedUsersModificationType.ADD) {
      const candidates: Candidate[] = candidatesAndUsers.map(
        (candidateOrUser) => {
          const candidate = isCandidate(candidateOrUser)
            ? candidateOrUser
            : candidateFromUser({chat, user: candidateOrUser});

          if (updateRestrictedTime) {
            candidate.restrictTime = chat.restrictTime || 24;
          }

          return candidate;
        },
      );

      await addMethod({
        chatId: chat.id,
        candidates,
      });
    } else {
      await removeMethod({
        chatId: chat.id,
        candidateIds: candidatesAndUsers.map((x) => x.id),
      });
    }
  } catch (err) {
    appContext.report(err);
  }
}

export type ModifyRestrictedUsersOptions = {
  appContext: AppContext;
  chat: Chat;
  candidatesAndUsers: Array<Candidate | Pick<User, 'id'>>;
};

export function addRestrictedUsers({
  appContext,
  chat,
  candidatesAndUsers,
}: ModifyRestrictedUsersOptions): Promise<void> {
  return botModifyRestrictedUsers({
    appContext,
    chat,
    candidatesAndUsers,
    type: RestrictedUsersType.RESTRICTED_USERS,
    actionType: RestrictedUsersModificationType.ADD,
    updateRestrictedTime: true,
  });
}

export function removeRestrictedUsers({
  appContext,
  chat,
  candidatesAndUsers,
}: ModifyRestrictedUsersOptions): Promise<void> {
  return botModifyRestrictedUsers({
    appContext,
    chat,
    candidatesAndUsers,
    type: RestrictedUsersType.RESTRICTED_USERS,
    actionType: RestrictedUsersModificationType.REMOVE,
  });
}

export function addCandidates({
  appContext,
  chat,
  candidatesAndUsers,
}: ModifyRestrictedUsersOptions): Promise<void> {
  return botModifyRestrictedUsers({
    appContext,
    chat,
    candidatesAndUsers,
    type: RestrictedUsersType.CANDIDATES,
    actionType: RestrictedUsersModificationType.ADD,
  });
}

export function removeCandidates({
  appContext,
  chat,
  candidatesAndUsers,
}: ModifyRestrictedUsersOptions): Promise<void> {
  return botModifyRestrictedUsers({
    appContext,
    chat,
    candidatesAndUsers,
    type: RestrictedUsersType.CANDIDATES,
    actionType: RestrictedUsersModificationType.REMOVE,
  });
}

const candidateFromUser = ({
  chat,
  user,
}: {
  chat: Chat;
  user: Pick<User, 'id'>;
}): Candidate => {
  return {
    ...user,
    timestamp: Date.now(),
    captchaType: chat.captchaType,
  };
};

const isCandidate = (
  candidateOrUser: Candidate | Pick<User, 'id'>,
): candidateOrUser is Candidate => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Boolean((candidateOrUser as any).captchaType);
};
