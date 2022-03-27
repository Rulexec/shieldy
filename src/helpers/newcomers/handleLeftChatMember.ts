import {deleteMessageSafe} from '@helpers/deleteMessageSafe';
import {Context} from '@sesuritu/types/src/context';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';

export async function handleLeftChatMember(ctx: Context): Promise<void> {
  assertNonNullish(ctx.message);

  // Check if this user got kicked
  const userWasKicked = await ctx.appContext.database.isUserKicked({
    chatId: ctx.dbchat.id,
    userId: ctx.message.left_chat_member.id,
  });
  // Delete left message if required
  if (
    ctx.dbchat.deleteEntryMessages ||
    ctx.dbchat.underAttack ||
    (ctx.dbchat.deleteEntryOnKick && userWasKicked)
  ) {
    deleteMessageSafe(ctx);
    return;
  }
  if (ctx.dbchat.deleteEntryOnKick) {
    ctx.appContext.database.modifyCandidateLeaveMessageId({
      chatId: ctx.dbchat.id,
      candidateId: ctx.message.left_chat_member.id,
      leaveMessageId: ctx.message.message_id,
    });
  }
}
