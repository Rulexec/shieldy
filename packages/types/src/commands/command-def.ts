import {L10nKey} from '../i18n/l10n-key';
import {BotMiddlewareFn} from '../bot';
import {AppContext} from '../app-context';

export type CommandDefSetupFn = (options: {appContext: AppContext}) => void;

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
