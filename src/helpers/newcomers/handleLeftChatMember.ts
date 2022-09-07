import {deleteMessageSafe} from '@helpers/deleteMessageSafe';
import {Context} from '@root/types/context';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {wrapTelegrafContextWithIdling} from '@root/util/telegraf/idling-context-wrapper';

async function handleLeftChatMemberInternal(ctx: Context): Promise<void> {
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

const handleLeftChatMemberWrapped = wrapTelegrafContextWithIdling(
  handleLeftChatMemberInternal,
);
export {handleLeftChatMemberWrapped as handleLeftChatMember};
