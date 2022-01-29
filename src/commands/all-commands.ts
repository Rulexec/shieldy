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
import {CommandDefSetupFn} from './types';

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
  ];
};
