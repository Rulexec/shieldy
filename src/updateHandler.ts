import 'module-alias/register';
import {attachUser} from '@middlewares/attachUser';
import {checkMemberChange, setupNewcomers} from '@helpers/newcomers';
import {checkTime} from '@middlewares/checkTime';
import {checkRestrict} from '@middlewares/checkRestrict';
import {checkNoChannelLinks} from '@middlewares/checkNoChannelLinks';
import {checkAllowInvitingBots} from '@commands/allowInvitingBots';
import {attachChatMember} from '@middlewares/attachChatMember';
import {checkBlockList} from '@middlewares/checkBlockList';
import {AppContext} from '@sesuritu/types/src/app-context';
import {Context} from '@sesuritu/types/src';
import {botDeleteMessageSafe} from './helpers/deleteMessageSafe';
import {strings} from './helpers/strings';
import {Language} from '@sesuritu/types/src/models/Chat';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from './bot/types';
import {checkAdminMiddleware} from './middlewares/checkAdmin';
import {checkLockMiddleware} from './middlewares/checkLock';
import {clarifyIfPrivateMessagesMiddleware} from './helpers/clarifyIfPrivateMessages';

export function setupBot(appContext: AppContext): void {
  const {
    telegrafBot: bot,
    addBotMiddleware,
    addBotCommand,
    commandDefinitions,
  } = appContext;

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
  // Newcomers logic
  setupNewcomers(appContext);

  commandDefinitions.forEach(
    ({
      key,
      onlyForAdmin,
      allowForMembers,
      allowInPrivateMessages,
      handler,
      setup,
    }) => {
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

      if (setup) {
        setup({appContext});
      }
    },
  );

  // Catch
  bot.catch(appContext.report);
}
