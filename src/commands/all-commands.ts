import {BotMiddlewareFn} from '@root/bot/types';
import {L10nKey} from '@root/i18n/l10n-key';
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

type CommandDef = {
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
      helpDescription: undefined,
      handler: allowInvitingBotsCommand,
    },
    {
      key: 'ban',
      helpDescription: undefined,
      onlyForAdmin: true,
      handler: banCommand,
    },
    {
      key: 'banNewTelegramUsers',
      helpDescription: undefined,
      handler: banNewTelegramUsersCommand,
    },
    {
      key: 'banUsers',
      helpDescription: undefined,
      handler: banUsersCommand,
    },
    {
      key: 'buttonText',
      helpDescription: undefined,
      handler: buttonTextCommand,
    },
    {
      key: 'captcha',
      helpDescription: undefined,
      handler: captchaCommand,
      setup: setupCaptchaCommand,
    },
    {
      key: 'customCaptchaMessage',
      helpDescription: undefined,
      handler: customCaptchaMessageCommand,
      setup: setupCustomCaptchaMessage,
    },
    {
      key: 'cas',
      helpDescription: undefined,
      handler: casCommand,
    },
    {
      key: 'deleteEntryMessages',
      helpDescription: undefined,
      handler: deleteEntryMessageCommand,
    },
    {
      key: 'deleteEntryOnKick',
      helpDescription: undefined,
      handler: deleteEntryOnKickCommand,
    },
    {
      key: 'viewCustomCaptcha',
      helpDescription: undefined,
      handler: viewCustomCaptchaCommand,
    },
    {
      key: 'removeAllCustomCaptcha',
      helpDescription: undefined,
      handler: removeAllCustomCaptchaCommand,
    },
    {
      key: 'addCustomCaptcha',
      helpDescription: undefined,
      handler: addCustomCaptchaCommand,
      setup: setupAddCustomCaptcha,
    },
    {
      key: 'deleteGreetingTime',
      helpDescription: undefined,
      handler: deleteGreetingTimeCommand,
    },
    {
      key: 'greeting',
      helpDescription: undefined,
      handler: greetingCommand,
      setup: setupGreeting,
    },
    {
      key: 'greetingButtons',
      helpDescription: undefined,
      handler: greetingButtonsCommand,
      setup: setupGreetingButtons,
    },
    {
      key: 'help',
      helpDescription: undefined,
      handler: helpCommand,
    },
    {
      key: 'start',
      helpDescription: undefined,
      handler: helpCommand,
    },
    {
      key: 'language',
      helpDescription: undefined,
      handler: languageCommand,
      setup: setupLanguage,
    },
    {
      key: 'lock',
      helpDescription: undefined,
      handler: lockCommand,
    },
    {
      key: 'noAttack',
      helpDescription: undefined,
      handler: noAttackCommand,
    },
    {
      key: 'noChannelLinks',
      helpDescription: undefined,
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
      helpDescription: undefined,
      handler: restrictCommand,
    },
    {
      key: 'restrictTime',
      helpDescription: undefined,
      handler: restrictTimeCommand,
    },
    {
      key: 'viewConfig',
      helpDescription: undefined,
      handler: viewConfigCommand,
    },
    {
      key: 'setConfig',
      helpDescription: undefined,
      handler: setConfigCommand,
    },
    {
      key: 'silent',
      helpDescription: undefined,
      handler: silentCommand,
    },
    {
      key: 'skipOldUsers',
      helpDescription: undefined,
      handler: skipOldUsersCommand,
    },
    {
      key: 'skipVerifiedUsers',
      helpDescription: undefined,
      handler: skipVerifiedUsersCommand,
    },
    {
      key: 'strict',
      helpDescription: undefined,
      handler: strictCommand,
    },
    {
      key: 'timeLimit',
      helpDescription: undefined,
      handler: timeLimitCommand,
      setup: setupTimeLimit,
    },
    {
      key: 'trust',
      helpDescription: undefined,
      handler: trustCommand,
    },
    {
      key: 'underAttack',
      helpDescription: undefined,
      handler: underAttackCommand,
    },
  ];
};
