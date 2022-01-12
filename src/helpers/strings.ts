import {Language} from '@models/Chat';
import {L10nKey} from '@root/i18n/l10n-key';
import {AppContext} from '@root/types/app-context';

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
