import 'module-alias/register';
import {botKickCandidates} from '@helpers/newcomers/kickCandidates';
import {removeRestrictedUsers} from '@helpers/restrictedUsers';
import {createContext} from './context';
import {Candidate} from './models/Chat';

const appContext = createContext({instanceId: 'kicker'});
const {report, logger} = appContext;

let checking = false;

appContext.run(() => {
  // Check candidates
  setInterval(() => {
    logger.trace('checkCandidates', {checking});
    if (!checking) {
      check();
    }
  }, 15 * 1000);

  logger.info('started');
});

async function check() {
  checking = true;
  try {
    logger.trace('findCandidates');
    const chats =
      await appContext.database.findChatsWithCandidatesOrRestrictedUsers();
    logger.trace('candidates', {chats: chats.length});

    for (const chat of chats) {
      // Check candidates
      const candidatesToDelete: Candidate[] = [];
      for (const candidate of chat.candidates) {
        if (
          new Date().getTime() - candidate.timestamp <
          chat.timeGiven * 1000
        ) {
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
          await botKickCandidates(appContext, chat, candidatesToDelete);
        } catch (err) {
          report(err, 'kickCandidatesAfterCheck');
        }
      }
      // Check restricted users
      const restrictedToDelete: Candidate[] = [];
      for (const candidate of chat.restrictedUsers) {
        if (
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
  } catch (err) {
    report(err, 'checking candidates');
  } finally {
    logger.trace('findCandidates:finish');
    checking = false;
  }
}
