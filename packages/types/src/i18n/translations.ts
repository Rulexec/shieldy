import type {AppContext} from '../app-context';
import {L10nKey} from './l10n-key';

export type ITranslations = {
  init: ({appContext}: {appContext: AppContext}) => Promise<void>;
  translate: (
    lang: string,
    key: L10nKey,
    params?: Record<string, string | number>,
  ) => string;
  getLanguagesList: () => string[];
};
