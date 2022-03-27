import {botDeleteMessageSafe} from '@helpers/deleteMessageSafe';
import {Chat, Candidate} from '@sesuritu/types/src/models/Chat';
import {addKickedUser} from '@helpers/newcomers/addKickedUser';
import {
  removeCandidates,
  removeRestrictedUsers,
} from '@helpers/restrictedUsers';
import {AppContext} from '@sesuritu/types/src/app-context';
import {removeEntryMessagesFromUser} from '../remove-entry-messages';

const chatMembersBeingKicked = {} as {
  [index: number]: {[index: number]: boolean};
};

export async function botKickCandidates(
  appContext: AppContext,
  chat: Chat,
  candidates: Candidate[],
): Promise<void> {
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
      kickChatMemberProxy(
        appContext,
        chat.id,
        candidate.id,
        chat.banUsers ? 0 : Math.floor(new Date().getTime() / 1000 + 45),
      );
    } catch (err) {
      appContext.report(err);
    }
    // Try deleting their entry messages
    if (
      chat.deleteEntryOnKick &&
      candidate.entryChatId &&
      candidate.leaveMessageId
    ) {
      removeEntryMessagesFromUser({
        appContext,
        chatId: candidate.entryChatId,
        fromId: candidate.id,
      });
      botDeleteMessageSafe(appContext, {
        chatId: candidate.entryChatId,
        messageId: candidate.leaveMessageId,
      });
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

async function kickChatMemberProxy(
  appContext: AppContext,
  id: number,
  candidateId: number,
  duration: number,
) {
  try {
    if (!chatMembersBeingKicked[id]) {
      chatMembersBeingKicked[id] = {};
    }
    chatMembersBeingKicked[id][candidateId] = true;
    await appContext.telegrafBot.telegram.kickChatMember(
      id,
      candidateId,
      duration,
    );
  } catch (err) {
    appContext.report(err);
  } finally {
    if (chatMembersBeingKicked[id] && chatMembersBeingKicked[id][candidateId]) {
      delete chatMembersBeingKicked[id][candidateId];
    }
  }
}
