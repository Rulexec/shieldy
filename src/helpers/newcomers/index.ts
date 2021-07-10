import {checkIfGroup} from '@middlewares/checkIfGroup';
import {isGroup} from '@helpers/isGroup';
import {notifyCandidate} from '@helpers/newcomers/notifyCandidate';
import {generateCaptcha} from '@helpers/newcomers/generateCaptcha';
import {Context} from '@root/types/context';
import {checkSuperAdminMiddleware} from '@middlewares/checkSuperAdmin';
import {greetUserMiddleware} from '@helpers/newcomers/greetUser';
import {handleLeftChatMember} from '@helpers/newcomers/handleLeftChatMember';
import {
  handleNewChatMember,
  handleNewChatMemberMessage,
} from '@helpers/newcomers/handleNewChatMembers';
import {handleButtonPress} from '@helpers/newcomers/checkButton';
import {checkPassingCaptchaWithText} from './checkPassingCaptchaWithText';
import {getChatMember} from '@root/types/hacks/get-chat-member';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {AppContext} from '@root/types/app-context';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export function setupNewcomers(appContext: AppContext): void {
  const {addBotCommand, addBotMiddleware, telegrafBot} = appContext;

  // Admin command to check greetings
  addBotCommand('greetMe', checkSuperAdminMiddleware, greetUserMiddleware);
  // Admin command to check captcha
  addBotCommand(
    'captchaMe',
    checkSuperAdminMiddleware,
    async (ctx: Context) => {
      assertNonNullish(ctx.from);

      const captcha = await generateCaptcha(ctx.dbchat);
      await notifyCandidate(ctx, ctx.from, captcha);

      return BotMiddlewareNextStrategy.abort;
    },
  );
  // Keep track of new member messages to delete them
  telegrafBot.on('new_chat_members', checkIfGroup, handleNewChatMemberMessage);
  // Keep track of leave messages and delete them if necessary
  telegrafBot.on('left_chat_member', handleLeftChatMember);
  // Check newcomers passing captcha with text

  addBotMiddleware(checkPassingCaptchaWithText);
  // Check newcomers passing captcha with button
  telegrafBot.action(/\d+~\d+/, handleButtonPress);
}

export const checkMemberChange: BotMiddlewareFn = async (ctx, {next}) => {
  // Check if this is a group
  if (!isGroup(ctx)) {
    Promise.resolve().then(() => next());
    return BotMiddlewareNextStrategy.async;
  }
  // Check if it's a chat_member update
  const chatMembers = getChatMember(ctx.update);
  if (!chatMembers) {
    Promise.resolve().then(() => next());
    return BotMiddlewareNextStrategy.async;
  }

  // Get users
  const oldChatMember = chatMembers.old_chat_member;
  const newChatMember = chatMembers.new_chat_member;
  // Check if joined
  if (oldChatMember.status === 'left' && newChatMember.status === 'member') {
    await handleNewChatMember(ctx);
    return BotMiddlewareNextStrategy.abort;
  }

  return BotMiddlewareNextStrategy.abort;
};
