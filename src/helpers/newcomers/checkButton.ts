import {Context} from '@root/types/context';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {removeCandidates} from '../restrictedUsers';
import {doGreetUser} from './greetUser';
import {T_} from '@root/i18n/l10n-key';

const buttonPresses = new Set<string>();

export async function handleButtonPress(ctx: Context): Promise<void> {
  assertNonNullish(ctx.callbackQuery);

  // Ignore muptiple taps
  if (buttonPresses.has(ctx.callbackQuery.data)) {
    return;
  }

  // Handle the button tap
  try {
    buttonPresses.add(ctx.callbackQuery.data);

    // Get user id and chat id
    const params = ctx.callbackQuery.data.split('~');
    const userId = parseInt(params[1], 10);

    assertNonNullish(ctx.from);

    // Check if button is pressed by the candidate
    if (userId !== ctx.from.id) {
      try {
        await ctx.answerCbQuery(ctx.translate(T_`only_candidate_can_reply`));
      } catch {
        // Do nothing
      }
      return;
    }
    // Check if this user is within candidates
    if (!ctx.dbchat.candidates.map((c) => c.id).includes(userId)) {
      return;
    }
    // Get the candidate
    const candidate = ctx.dbchat.candidates
      .filter((c) => c.id === userId)
      .pop();

    if (candidate) {
      // Remove candidate from the chat
      await removeCandidates({
        appContext: ctx.appContext,
        chat: ctx.dbchat,
        candidatesAndUsers: [candidate],
      });

      if (candidate.messageId) {
        assertNonNullish(ctx.chat);

        // Delete the captcha message
        ctx.deleteMessageSafe({
          chatId: ctx.chat.id,
          messageId: candidate.messageId,
        });
      }
    }

    // Greet the user
    doGreetUser(ctx);
  } catch (err) {
    ctx.appContext.report(err);
  } finally {
    buttonPresses.delete(ctx.callbackQuery.data);
  }
}
