import {BotMiddlewareFn} from '@root/bot/types';
import {L10nKey} from '@root/i18n/l10n-key';
import {sourceCommandHandler} from './admin';

type CommandDef = {
  key: string;
  helpDescription: L10nKey | undefined;
  onlyForAdmin?: boolean;
  handler: BotMiddlewareFn;
};

export const getCommands = (): CommandDef[] => {
  return [
    {
      key: 'source',
      helpDescription: undefined,
      onlyForAdmin: true,
      handler: sourceCommandHandler,
    },
  ];
};
