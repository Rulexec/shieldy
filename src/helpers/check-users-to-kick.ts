import {Candidate} from '@root/models/Chat';
import {AppContext} from '@root/types/app-context';
import {KickReason} from '@root/types/telegram/kick-reason';
import {Logger} from '@root/util/logging/types';
import {botKickCandidates} from './newcomers/kickCandidates';
import {removeRestrictedUsers} from './restrictedUsers';

export const checkUsersToKick = async ({
  appContext,
  logger,
}: {
  appContext: AppContext;
  logger: Logger;
}): Promise<void> => {
  const {database, report} = appContext;

  const chats = await database.findChatsWithCandidatesOrRestrictedUsers();

  for (const chat of chats) {
    // Check candidates
    const candidatesToDelete: Candidate[] = [];
    for (const candidate of chat.candidates) {
      if (new Date().getTime() - candidate.timestamp < chat.timeGiven * 1000) {
        continue;
      }
      candidatesToDelete.push(candidate);
    }
    if (candidatesToDelete.length) {
      logger.info('kicking', {
        count: candidatesToDelete.length,
        chatId: chat.id,
      });
      try {
        await botKickCandidates({
          appContext,
          chat,
          candidates: candidatesToDelete,
          reason: KickReason.captchaTimeout,
        });
      } catch (err) {
        report(err, 'kickCandidatesAfterCheck');
      }
    }
    // Check restricted users
    const restrictedToDelete: Candidate[] = [];
    for (const candidate of chat.restrictedUsers) {
      if (
        !candidate.timestamp ||
        new Date().getTime() - candidate.timestamp >
          (candidate.restrictTime || 24) * 60 * 60 * 1000
      ) {
        restrictedToDelete.push(candidate);
      }
    }
    if (restrictedToDelete.length) {
      try {
        await removeRestrictedUsers({
          appContext,
          chat,
          candidatesAndUsers: restrictedToDelete,
        });
      } catch (err) {
        report(err, 'removeRestrictAfterCheck');
      }
    }
  }
};
