import {deleteMessageSafe} from '@helpers/deleteMessageSafe';
import {doGreetUser} from '@helpers/newcomers/greetUser';
import {Candidate, CaptchaType} from '@models/Chat';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {removeCandidates} from '../restrictedUsers';

export const checkPassingCaptchaWithText: BotMiddlewareFn = async (ctx) => {
  const fromUser = ctx.from;

  assertNonNullish(fromUser);

  // Check if it is a message is from a candidates
  if (
    !ctx.dbchat.candidates.length ||
    !ctx.dbchat.candidates.map((c) => c.id).includes(fromUser.id)
  ) {
    return BotMiddlewareNextStrategy.next;
  }
  // Check if it is not a text message in a strict mode
  if (!ctx.message?.text) {
    if (ctx.dbchat.strict) {
      deleteMessageSafe(ctx);
    }
    return BotMiddlewareNextStrategy.next;
  }
  // Check if it is a button captcha (shouldn't get to this function then)
  if (ctx.dbchat.captchaType === CaptchaType.BUTTON) {
    // Delete message of restricted
    if (ctx.dbchat.strict) {
      deleteMessageSafe(ctx);
    }
    // Exit the function
    return BotMiddlewareNextStrategy.next;
  }

  let hasCorrectAnswer = true;
  let needToDeleteMessage = ctx.dbchat.strict;

  // Get candidate
  const candidate: Candidate | undefined = ctx.dbchat.candidates
    .filter((c) => c.id === fromUser.id)
    .pop();

  assertNonNullish(candidate);

  // Check if it is digits captcha
  if (candidate.captchaType === CaptchaType.DIGITS) {
    // Check the format
    const hasNoMoreThanTwoDigits =
      (ctx.message.text.match(/\d/g) || []).length <= 2;
    hasCorrectAnswer =
      hasNoMoreThanTwoDigits &&
      ctx.message.text.includes(candidate.equationAnswer as string);
    needToDeleteMessage = true;
  }
  // Check if it is image captcha
  if (candidate.captchaType === CaptchaType.IMAGE && candidate.imageText) {
    hasCorrectAnswer = ctx.message.text.includes(candidate.imageText);
    needToDeleteMessage = true;
  }
  if (candidate.captchaType === CaptchaType.CUSTOM && candidate.customAnswer) {
    hasCorrectAnswer = checkCustomCaptcha({
      userAnswer: ctx.message.text,
      answer: candidate.customAnswer,
    });
    needToDeleteMessage = true;
  }

  if (needToDeleteMessage) {
    // Delete message to decrease the amount of messages left
    deleteMessageSafe(ctx);
  }
  if (!hasCorrectAnswer) {
    return BotMiddlewareNextStrategy.next;
  }

  // Passed the captcha, delete from candidates
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

  // Greet user
  doGreetUser(ctx);

  if (
    candidate.captchaType === CaptchaType.DIGITS ||
    candidate.captchaType === CaptchaType.IMAGE
  ) {
    ctx.appContext.database.addVerifiedUserId(fromUser.id);
  }

  return BotMiddlewareNextStrategy.next;
};

const checkCustomCaptcha = ({
  userAnswer,
  answer,
}: {
  userAnswer: any;
  answer: string;
}): boolean => {
  if (typeof userAnswer !== 'string') {
    return false;
  }

  const answers = answer
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  return answers.indexOf(userAnswer.trim().toLowerCase()) >= 0;
};
