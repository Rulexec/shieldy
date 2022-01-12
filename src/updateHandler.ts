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
import {setupBan} from '@commands/ban';
import {setupUnderAttack} from '@commands/underAttack';
import {setupNoAttack} from '@commands/noAttack';
import {setupViewConfig} from '@commands/viewConfig';
import {setupButtonText} from '@commands/buttonText';
import {
  setupAllowInvitingBots,
  checkAllowInvitingBots,
} from '@commands/allowInvitingBots';
import {setupAdmin} from '@commands/admin';
import {setupGreetingButtons} from '@commands/greetingButtons';
import {setupSkipOldUsers} from '@commands/skipOldUsers';
import {setupSkipVerifiedUsers} from '@commands/skipVerifiedUsers';
import {setupSetConfig} from '@commands/setConfig';
import {attachChatMember} from '@middlewares/attachChatMember';
import {checkBlockList} from '@middlewares/checkBlockList';
import {setupBanForFastRepliesToPosts} from '@commands/banForFastRepliesToPosts';
import {setupRestrictTime} from '@commands/restrictTime';
import {setupBanNewTelegramUsers} from '@commands/banNewTelegramUsers';
import {AppContext} from './types/app-context';
import {Context} from './types';
import {botDeleteMessageSafe} from './helpers/deleteMessageSafe';
import {strings} from './helpers/strings';
import {Language} from './models/Chat';
import {BotMiddlewareNextStrategy} from './bot/types';
import {setupPing} from './commands/ping';
import {setupSilent} from './commands/silent';

export function setupBot(appContext: AppContext): void {
  const {telegrafBot: bot, addBotMiddleware} = appContext;

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
  setupBan(bot);
  setupUnderAttack(bot);
  setupNoAttack(bot);
  setupViewConfig(bot);
  setupButtonText(bot);
  setupAllowInvitingBots(bot);
  setupAdmin(bot);
  setupGreetingButtons(bot);
  setupSkipOldUsers(bot);
  setupSkipVerifiedUsers(bot);
  setupSetConfig(bot);
  setupBanForFastRepliesToPosts(bot);
  setupRestrictTime(bot);
  setupBanNewTelegramUsers(bot);
  setupPing(appContext);
  setupSilent(appContext);
  // Newcomers logic
  setupNewcomers(appContext);

  // Catch
  bot.catch(appContext.report);
}
