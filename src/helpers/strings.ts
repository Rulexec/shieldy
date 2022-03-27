import {Language} from '@sesuritu/types/src/models/Chat';
import {L10nKey} from '@sesuritu/types/src/i18n/l10n-key';
import {AppContext} from '@sesuritu/types/src/app-context';

/**
 * @depreated use `appContext.translations.translate()`
 */
export function strings(
  appContext: AppContext,
  language: Language,
  key: L10nKey,
): string {
  return appContext.translations.translate(language, key);
}
