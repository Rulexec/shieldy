import {BotMiddlewareFn} from '@root/bot/types';
import {L10nKey} from '@root/i18n/l10n-key';
import {sourceCommandHandler} from './admin';
import {allowInvitingBotsCommand} from './allowInvitingBots';
import {banCommand} from './ban';
import {banNewTelegramUsersCommand} from './banNewTelegramUsers';

type CommandDef = {
  key: string;
  helpDescription: L10nKey | undefined;
  /** mark extra dangerous methods */
  onlyForAdmin?: boolean;
  allowInPrivateMessages?: boolean;
  /** those commands will be not disabled for users after /lock */
  allowForMembers?: boolean;
  handler: BotMiddlewareFn;
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
  ];
};
