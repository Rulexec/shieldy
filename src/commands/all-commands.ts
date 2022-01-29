import {BotMiddlewareFn} from '@root/bot/types';
import {L10nKey, T_} from '@root/i18n/l10n-key';
import {sourceCommandHandler} from './admin';
import {allowInvitingBotsCommand} from './allowInvitingBots';
import {banCommand} from './ban';
import {banNewTelegramUsersCommand} from './banNewTelegramUsers';
import {banUsersCommand} from './banUsers';
import {buttonTextCommand} from './buttonText';
import {captchaCommand, setupCaptchaCommand} from './captcha';
import {
  customCaptchaMessageCommand,
  setupCustomCaptchaMessage,
} from './customCaptchaMessage';
import {casCommand} from './cas';
import {CommandDefSetupFn} from './types';
import {deleteEntryMessageCommand} from './deleteEntryMessages';
import {deleteEntryOnKickCommand} from './deleteEntryOnKick';
import {
  addCustomCaptchaCommand,
  removeAllCustomCaptchaCommand,
  setupAddCustomCaptcha,
  viewCustomCaptchaCommand,
} from './customCaptcha';
import {deleteGreetingTimeCommand} from './deleteGreetingTime';
import {greetingCommand, setupGreeting} from './greeting';
import {greetingButtonsCommand, setupGreetingButtons} from './greetingButtons';
import {helpCommand} from './help';
import {languageCommand, setupLanguage} from './language';
import {lockCommand} from './lock';
import {noAttackCommand} from './noAttack';
import {noChannelLinksCommand} from './noChannelLinks';
import {pingCommand} from './ping';
import {restrictCommand} from './restrict';
import {restrictTimeCommand} from './restrictTime';
import {setConfigCommand} from './setConfig';
import {viewConfigCommand} from './viewConfig';
import {silentCommand} from './silent';
import {skipOldUsersCommand} from './skipOldUsers';
import {skipVerifiedUsersCommand} from './skipVerifiedUsers';
import {strictCommand} from './strict';
import {setupTimeLimit, timeLimitCommand} from './timeLimit';
import {trustCommand} from './trust';
import {underAttackCommand} from './underAttack';

export type TelegramCommandScopeType =
  | 'all_private_chats'
  | 'all_group_chats'
  | 'all_chat_administrators';

export type TelegramCommandScopeObject = {type: TelegramCommandScopeType};

export type CommandDef = {
  key: string;
  helpDescription: L10nKey | undefined;
  /** mark extra dangerous methods */
  onlyForAdmin?: boolean;
  allowInPrivateMessages?: boolean;
  /** those commands will be not disabled for users after /lock */
  allowForMembers?: boolean;
  handler: BotMiddlewareFn;
  // TODO: eliminate this param too, add more types of handlers to be more declarative
  setup?: CommandDefSetupFn;
};

export const getCommandTelegramCommandScopes = ({
  helpDescription,
  onlyForAdmin,
  allowInPrivateMessages,
  allowForMembers,
}: CommandDef): TelegramCommandScopeObject[] => {
  const scopes: TelegramCommandScopeObject[] = [];

  if (!helpDescription) {
    return scopes;
  }

  if (onlyForAdmin || !allowForMembers) {
    scopes.push({type: 'all_chat_administrators'});
  }

  if (allowInPrivateMessages) {
    scopes.push({type: 'all_private_chats'});
  }

  if (allowForMembers) {
    scopes.push({type: 'all_group_chats'});
  }

  return scopes;
};

export const getCommands = (): CommandDef[] => {
  return [
    {
      key: 'source',
      helpDescription: undefined,
      allowInPrivateMessages: true,
      handler: sourceCommandHandler,
    },
    {
      key: 'allowInvitingBots',
      helpDescription: T_`allowInvitingBots_help`,
      handler: allowInvitingBotsCommand,
    },
    {
      key: 'ban',
      helpDescription: T_`ban_help`,
      onlyForAdmin: true,
      handler: banCommand,
    },
    {
      key: 'banNewTelegramUsers',
      helpDescription: T_`banNewTelegramUsers_help`,
      handler: banNewTelegramUsersCommand,
    },
    {
      key: 'banUsers',
      helpDescription: T_`banUsers_help`,
      handler: banUsersCommand,
    },
    {
      key: 'buttonText',
      helpDescription: T_`buttonText_help`,
      handler: buttonTextCommand,
    },
    {
      key: 'captcha',
      helpDescription: T_`captcha_help`,
      handler: captchaCommand,
      setup: setupCaptchaCommand,
    },
    {
      key: 'customCaptchaMessage',
      helpDescription: T_`customCaptchaMessage_help`,
      handler: customCaptchaMessageCommand,
      setup: setupCustomCaptchaMessage,
    },
    {
      key: 'cas',
      helpDescription: T_`cas_help`,
      handler: casCommand,
    },
    {
      key: 'deleteEntryMessages',
      helpDescription: T_`deleteEntryMessages_help`,
      handler: deleteEntryMessageCommand,
    },
    {
      key: 'deleteEntryOnKick',
      helpDescription: T_`deleteEntryOnKick_help`,
      handler: deleteEntryOnKickCommand,
    },
    {
      key: 'viewCustomCaptcha',
      helpDescription: T_`viewCustomCaptcha_help`,
      handler: viewCustomCaptchaCommand,
    },
    {
      key: 'removeAllCustomCaptcha',
      helpDescription: T_`removeAllCustomCaptcha_help`,
      handler: removeAllCustomCaptchaCommand,
    },
    {
      key: 'addCustomCaptcha',
      helpDescription: T_`addCustomCaptcha_help`,
      handler: addCustomCaptchaCommand,
      setup: setupAddCustomCaptcha,
    },
    {
      key: 'deleteGreetingTime',
      helpDescription: T_`deleteGreetingTime_help`,
      handler: deleteGreetingTimeCommand,
    },
    {
      key: 'greeting',
      helpDescription: T_`greeting_help`,
      handler: greetingCommand,
      setup: setupGreeting,
    },
    {
      key: 'greetingButtons',
      helpDescription: T_`greetingButtons_help`,
      handler: greetingButtonsCommand,
      setup: setupGreetingButtons,
    },
    {
      key: 'help',
      helpDescription: T_`help_help`,
      allowInPrivateMessages: true,
      handler: helpCommand,
    },
    {
      key: 'start',
      helpDescription: undefined,
      allowInPrivateMessages: true,
      handler: helpCommand,
    },
    {
      key: 'language',
      helpDescription: T_`language_help`,
      handler: languageCommand,
      setup: setupLanguage,
    },
    {
      key: 'lock',
      helpDescription: T_`lock_help`,
      handler: lockCommand,
    },
    {
      key: 'noAttack',
      helpDescription: T_`noAttack_help`,
      handler: noAttackCommand,
    },
    {
      key: 'noChannelLinks',
      helpDescription: T_`noChannelLinks_help`,
      handler: noChannelLinksCommand,
    },
    {
      key: 'ping',
      helpDescription: undefined,
      allowForMembers: true,
      allowInPrivateMessages: true,
      handler: pingCommand,
    },
    {
      key: 'restrict',
      helpDescription: T_`restrict_help`,
      handler: restrictCommand,
    },
    {
      key: 'restrictTime',
      helpDescription: T_`restrictTime_help`,
      handler: restrictTimeCommand,
    },
    {
      key: 'viewConfig',
      helpDescription: T_`viewConfig_help`,
      handler: viewConfigCommand,
    },
    {
      key: 'setConfig',
      helpDescription: T_`setConfig_help`,
      handler: setConfigCommand,
    },
    {
      key: 'silent',
      helpDescription: T_`silent_help`,
      handler: silentCommand,
    },
    {
      key: 'skipOldUsers',
      helpDescription: T_`skipOldUsers_help`,
      handler: skipOldUsersCommand,
    },
    {
      key: 'skipVerifiedUsers',
      helpDescription: T_`skipVerifiedUsers_help`,
      handler: skipVerifiedUsersCommand,
    },
    {
      key: 'strict',
      helpDescription: T_`strict_help`,
      handler: strictCommand,
    },
    {
      key: 'timeLimit',
      helpDescription: T_`timeLimit_help`,
      handler: timeLimitCommand,
      setup: setupTimeLimit,
    },
    {
      key: 'trust',
      helpDescription: T_`trust_help`,
      handler: trustCommand,
    },
    {
      key: 'underAttack',
      helpDescription: T_`underAttack_help`,
      handler: underAttackCommand,
    },
  ];
};
