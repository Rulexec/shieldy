import {botDeleteMessageSafe} from '@helpers/deleteMessageSafe';
import {Chat, Candidate} from '@models/Chat';
import {addKickedUser} from '@helpers/newcomers/addKickedUser';
import {
  removeCandidates,
  removeRestrictedUsers,
} from '@helpers/restrictedUsers';
import {AppContext} from '@root/types/app-context';
import {removeEntryMessagesFromUser} from '../remove-entry-messages';
import {KickReason} from '@root/types/telegram/kick-reason';

const chatMembersBeingKicked = {} as {
  [index: number]: {[index: number]: boolean};
};

export async function botKickCandidates({
  appContext,
  chat,
  candidates,
  reason,
}: {
  appContext: AppContext;
  chat: Chat;
  candidates: Candidate[];
  reason: KickReason;
}): Promise<void> {
  const {logger} = appContext;

  // Loop through candidates
  for (const candidate of candidates) {
    // Check if they are already being kicked
    if (
      chatMembersBeingKicked[chat.id] &&
      chatMembersBeingKicked[chat.id][candidate.id]
    ) {
      logger.trace('botKickCandidates:alreadyKicked', {id: candidate.id});
      continue;
    }
    // Try kicking the candidate
    try {
      await addKickedUser(appContext, chat, candidate.id);
      kickChatMemberProxy({
        appContext,
        id: chat.id,
        candidateId: candidate.id,
        duration: chat.banUsers
          ? 0
          : Math.floor(new Date().getTime() / 1000 + 45),
        reason,
      });
    } catch (err) {
      appContext.report(err);
    }
    // Try deleting their entry messages
    if (chat.deleteEntryOnKick && candidate.entryChatId) {
      removeEntryMessagesFromUser({
        appContext,
        chatId: candidate.entryChatId,
        fromId: candidate.id,
      });

      if (candidate.leaveMessageId) {
        botDeleteMessageSafe(appContext, {
          chatId: candidate.entryChatId,
          messageId: candidate.leaveMessageId,
        });
      }
    }
    if (candidate.messageId) {
      // Try deleting the captcha message
      botDeleteMessageSafe(appContext, {
        chatId: chat.id,
        messageId: candidate.messageId,
      });
    }
  }
  // Remove from candidates
  await removeCandidates({
    appContext,
    chat,
    candidatesAndUsers: candidates,
  });
  // Remove from restricted
  await removeRestrictedUsers({
    appContext,
    chat,
    candidatesAndUsers: candidates,
  });
}

async function kickChatMemberProxy({
  appContext,
  id,
  candidateId,
  duration,
  reason,
}: {
  appContext: AppContext;
  id: number;
  candidateId: number;
  duration: number;
  reason: KickReason;
}) {
  const {
    telegrafBot: {telegram},
    logger,
    report,
  } = appContext;

  logger.info('kick', {
    fn: 'kickChatMemberProxy',
    reason,
    chatId: id,
    userId: candidateId,
  });

  try {
    if (!chatMembersBeingKicked[id]) {
      chatMembersBeingKicked[id] = {};
    }
    chatMembersBeingKicked[id][candidateId] = true;
    await telegram.kickChatMember(id, candidateId, duration);
  } catch (err) {
    report(err);
  } finally {
    if (chatMembersBeingKicked[id] && chatMembersBeingKicked[id][candidateId]) {
      delete chatMembersBeingKicked[id][candidateId];
    }
  }
}
