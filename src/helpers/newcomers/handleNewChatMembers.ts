import {ChatMember} from 'telegram-typings';
import {Candidate} from '@models/Chat';
import {Context} from '@root/types/context';
import {modifyGloballyRestricted} from '@helpers/globallyRestricted';
import {sendHelpSafe} from '@commands/help';
import {doGreetUser} from '@helpers/newcomers/greetUser';
import {checkCAS} from '@helpers/cas';
import {generateCaptcha} from '@helpers/newcomers/generateCaptcha';
import {notifyCandidate} from '@helpers/newcomers/notifyCandidate';
import {getCandidate} from '@helpers/newcomers/getCandidate';
import {deleteMessageSafe} from '@helpers/deleteMessageSafe';
import {getChatMember} from '@root/types/hacks/get-chat-member';
import {addCandidates, addRestrictedUsers} from '../restrictedUsers';
import {botKickChatMember} from './kickChatMember';
import {botRestrictChatMember} from './restrictChatMember';
import {removeCappedMessagesFromUser} from '../remove-messages-from-user';
import {removeEntryMessagesFromUser} from '../remove-entry-messages';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';

export async function handleNewChatMember(ctx: Context): Promise<void> {
  // Check if no attack mode
  if (ctx.dbchat.noAttack) {
    return;
  }
  // Get new member
  const chatMembers = getChatMember(ctx.update);
  assertNonNullish(chatMembers);

  const newChatMember = chatMembers.new_chat_member as ChatMember;
  // Get list of ids
  const memberId = newChatMember.user.id;
  // Add to globaly restricted list
  await modifyGloballyRestricted([memberId], true);
  // Start the newcomers logic
  try {
    // If an admin adds the members, do nothing
    const adder = await ctx.getChatMember(chatMembers.from.id);
    if (['creator', 'administrator'].includes(adder.status)) {
      return;
    }
    // Filter new members
    const membersToCheck = [newChatMember.user];
    // Placeholder to add all candidates in batch
    const candidatesToAdd = [] as Candidate[];
    // Loop through the members
    for (const member of membersToCheck) {
      // Check if an old user
      if (ctx.dbchat.skipOldUsers) {
        if (member.id > 0 && member.id < 1000000000) {
          doGreetUser(ctx, member);
          if (ctx.dbchat.restrict) {
            addRestrictedUsers({
              appContext: ctx.appContext,
              chat: ctx.dbchat,
              candidatesAndUsers: [member],
            });
          }
          continue;
        }
      }
      // Check if a verified user
      if (ctx.dbchat.skipVerifiedUsers) {
        if (await ctx.appContext.database.isUserIdVerified(member.id)) {
          doGreetUser(ctx, member);
          if (ctx.dbchat.restrict) {
            addRestrictedUsers({
              appContext: ctx.appContext,
              chat: ctx.dbchat,
              candidatesAndUsers: [member],
            });
          }
          continue;
        }
      }

      assertNonNullish(ctx.chat);

      // Delete all messages that they've sent so far
      removeCappedMessagesFromUser({
        appContext: ctx.appContext,
        chatId: ctx.chat.id,
        fromId: member.id,
      });
      // Check if under attack
      if (ctx.dbchat.underAttack) {
        botKickChatMember(ctx.appContext, ctx.dbchat, member);
        continue;
      }
      // Check if id is over 1 000 000 000
      if (ctx.dbchat.banNewTelegramUsers && member.id > 1000000000) {
        botKickChatMember(ctx.appContext, ctx.dbchat, member);
        if (ctx.dbchat.deleteEntryOnKick) {
          removeEntryMessagesFromUser({
            appContext: ctx.appContext,
            chatId: ctx.chat.id,
            fromId: memberId,
          });
        }
        continue;
      }
      // Check if CAS banned
      if (ctx.dbchat.cas && !(await checkCAS(member.id))) {
        botKickChatMember(ctx.appContext, ctx.dbchat, member);
        if (ctx.dbchat.deleteEntryOnKick) {
          removeEntryMessagesFromUser({
            appContext: ctx.appContext,
            chatId: ctx.chat.id,
            fromId: memberId,
          });
        }
        continue;
      }
      // Check if already a candidate
      if (ctx.dbchat.candidates.map((c) => c.id).includes(member.id)) {
        continue;
      }
      // Generate captcha if required
      const captcha = await generateCaptcha(ctx.dbchat);
      // Notify candidate and save the message
      let message;
      try {
        message = await notifyCandidate(ctx, member, captcha);
      } catch (err) {
        ctx.appContext.report(err);
      }
      // Create a candidate
      const candidate = getCandidate(ctx, member, captcha, message);
      // Restrict candidate if required
      if (ctx.dbchat.restrict) {
        botRestrictChatMember(ctx.appContext, ctx.dbchat, member);
      }
      // Save candidate to the placeholder list
      candidatesToAdd.push(candidate);
    }
    // Add candidates to the list
    await addCandidates({
      appContext: ctx.appContext,
      chat: ctx.dbchat,
      candidatesAndUsers: candidatesToAdd,
    });
    // Restrict candidates if required
    await addRestrictedUsers({
      appContext: ctx.appContext,
      chat: ctx.dbchat,
      candidatesAndUsers: candidatesToAdd,
    });

    assertNonNullish(ctx.chat);

    // Delete all messages that they've sent so far
    for (const member of candidatesToAdd) {
      removeCappedMessagesFromUser({
        appContext: ctx.appContext,
        chatId: ctx.chat.id,
        fromId: member.id,
      }); // don't await here
    }
  } catch (error) {
    ctx.appContext.logger.error('onNewChatMembers', undefined, {error});
  } finally {
    // Remove from globaly restricted list
    modifyGloballyRestricted([memberId], false);
  }
}

export async function handleNewChatMemberMessage(ctx: Context): Promise<void> {
  assertNonNullish(ctx.message);
  assertNonNullish(ctx.appContext.telegrafBot.botInfo);

  // Send help message if added this bot to the group
  const addedUsernames = ctx.message.new_chat_members
    .map((member) => member.username)
    .filter((username) => !!username);
  if (addedUsernames.includes(ctx.appContext.telegrafBot.botInfo.username)) {
    await sendHelpSafe(ctx);
    return;
  }
  // Check if no attack mode
  if (ctx.dbchat.noAttack) {
    return;
  }
  // Check if needs to delete message right away
  if (ctx.dbchat.deleteEntryMessages || ctx.dbchat.underAttack) {
    deleteMessageSafe(ctx);
    return;
  }
  // Save for later if needs deleting
  if (ctx.dbchat.deleteEntryOnKick) {
    assertNonNullish(ctx.chat);

    for (const newMember of ctx.message.new_chat_members) {
      await ctx.appContext.database.addEntryMessage({
        message_id: ctx.message.message_id,
        chat_id: ctx.chat.id,
        from_id: newMember.id,
      });
    }
  }
}
