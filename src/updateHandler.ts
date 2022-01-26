import 'module-alias/register';
import {attachUser} from '@middlewares/attachUser';
import {setupHelp} from '@commands/help';
import {setupLanguage} from '@commands/language';
import {setupCaptcha} from '@commands/captcha';
import {setupCustomCaptcha} from '@commands/customCaptcha';
import {checkMemberChange, setupNewcomers} from '@helpers/newcomers';
import {setupTimeLimit} from '@commands/timeLimit';
import {setupLock} from '@commands/lock';
import {checkTime} from '@middlewares/checkTime';
import {setupRestrict} from '@commands/restrict';
import {checkRestrict} from '@middlewares/checkRestrict';
import {setupNoChannelLinks} from '@commands/noChannelLinks';
import {checkNoChannelLinks} from '@middlewares/checkNoChannelLinks';
import {setupDeleteEntryMessages} from '@commands/deleteEntryMessages';
import {setupGreeting} from '@commands/greeting';
import {setupTrust} from '@commands/trust';
import {setupStrict} from '@commands/strict';
import {setupCaptchaMessage} from '@commands/captchaMessage';
import {setupDeleteGreetingTime} from '@commands/deleteGreetingTime';
import {setupBanUsers} from '@commands/banUsers';
import {setupDeleteEntryOnKick} from '@commands/deleteEntryOnKick';
import {setupCAS} from '@commands/cas';
import {setupUnderAttack} from '@commands/underAttack';
import {setupNoAttack} from '@commands/noAttack';
import {setupViewConfig} from '@commands/viewConfig';
import {setupButtonText} from '@commands/buttonText';
import {checkAllowInvitingBots} from '@commands/allowInvitingBots';
import {setupGreetingButtons} from '@commands/greetingButtons';
import {setupSkipOldUsers} from '@commands/skipOldUsers';
import {setupSkipVerifiedUsers} from '@commands/skipVerifiedUsers';
import {setupSetConfig} from '@commands/setConfig';
import {attachChatMember} from '@middlewares/attachChatMember';
import {checkBlockList} from '@middlewares/checkBlockList';
import {setupRestrictTime} from '@commands/restrictTime';
import {AppContext} from './types/app-context';
import {Context} from './types';
import {botDeleteMessageSafe} from './helpers/deleteMessageSafe';
import {strings} from './helpers/strings';
import {Language} from './models/Chat';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from './bot/types';
import {setupPing} from './commands/ping';
import {setupSilent} from './commands/silent';
import {getCommands} from './commands/all-commands';
import {checkAdminMiddleware} from './middlewares/checkAdmin';
import {checkLockMiddleware} from './middlewares/checkLock';
import {clarifyIfPrivateMessagesMiddleware} from './helpers/clarifyIfPrivateMessages';

export function setupBot(appContext: AppContext): void {
  const {telegrafBot: bot, addBotMiddleware, addBotCommand} = appContext;

  addBotMiddleware((context: Context): BotMiddlewareNextStrategy => {
    context.appContext = appContext;
    context.translate = (key) => {
      appContext.logger.warning('setupBot:translate:preAttachChat', {key});
      return strings(appContext, Language.ENGLISH, key);
    };

    context.deleteMessageSafe = (options) =>
      botDeleteMessageSafe(appContext, options);

    return BotMiddlewareNextStrategy.next;
  });

  // Ignore all messages that are too old
  addBotMiddleware(checkTime);
  // Check block list
  addBotMiddleware(checkBlockList);
  // Add chat to context
  addBotMiddleware(attachUser);
  // Check if chat_member update
  addBotMiddleware(checkMemberChange);
  // Remove bots right when they get added
  addBotMiddleware(checkAllowInvitingBots);
  // Add chat member to context
  addBotMiddleware(attachChatMember);
  // Check if restricted
  addBotMiddleware(checkRestrict);
  // Check if channel links are present
  addBotMiddleware(checkNoChannelLinks);
  // Commands
  setupHelp(appContext);
  setupLanguage(bot);
  setupCaptcha(appContext);
  setupCustomCaptcha(appContext);
  setupTimeLimit(bot);
  setupLock(bot);
  setupRestrict(bot);
  setupNoChannelLinks(bot);
  setupDeleteEntryMessages(bot);
  setupGreeting(bot);
  setupTrust(bot);
  setupStrict(bot);
  setupCaptchaMessage(appContext);
  setupDeleteGreetingTime(bot);
  setupBanUsers(bot);
  setupDeleteEntryOnKick(bot);
  setupCAS(bot);
  setupUnderAttack(bot);
  setupNoAttack(bot);
  setupViewConfig(bot);
  setupButtonText(bot);
  setupGreetingButtons(bot);
  setupSkipOldUsers(bot);
  setupSkipVerifiedUsers(bot);
  setupSetConfig(bot);
  setupRestrictTime(bot);
  setupPing(appContext);
  setupSilent(appContext);
  // Newcomers logic
  setupNewcomers(appContext);

  getCommands().forEach(
    ({key, onlyForAdmin, allowForMembers, allowInPrivateMessages, handler}) => {
      const middlewares: BotMiddlewareFn[] = [];

      if (onlyForAdmin) {
        middlewares.push(checkAdminMiddleware);
      } else if (!allowForMembers) {
        middlewares.push(checkLockMiddleware);
      }

      if (!allowInPrivateMessages) {
        middlewares.push(clarifyIfPrivateMessagesMiddleware);
      }

      middlewares.push(handler);

      addBotCommand(key, ...middlewares);
    },
  );

  // Catch
  bot.catch(appContext.report);
}
