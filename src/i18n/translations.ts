import IntlMessageFormat from 'intl-messageformat';
import {AppContext} from '@root/types/app-context';
import {Logger} from '@root/util/logging/types';
import {L10nKey} from './l10n-key';
import {TranslationLoader} from './translations-loader-types';
import {getNoTranslationText} from './no-translation';

export type TranslationsOptions = {
  getTranslationsLoader: (options: {
    appContext: AppContext;
  }) => TranslationLoader;
  logger: Logger;
};

type LangKey = string;
type LangRecord = Record<L10nKey, IntlMessageFormat>;

export class Translations {
  private getTranslationsLoader: TranslationsOptions['getTranslationsLoader'];
  private langs: Record<LangKey, LangRecord> = {};
  private logger: Logger;

  constructor({getTranslationsLoader, logger}: TranslationsOptions) {
    this.getTranslationsLoader = getTranslationsLoader;
    this.logger = logger;
  }

  init = async ({appContext}: {appContext: AppContext}): Promise<void> => {
    const loader = this.getTranslationsLoader({appContext});
    const langs = await loader();

    langs.forEach(({lang, translations}) => {
      const intlTranslations: LangRecord = {};
      this.langs[lang] = intlTranslations;

      for (const [key, message] of Object.entries(translations)) {
        intlTranslations[key] = new IntlMessageFormat(message);
      }
    });
  };

  translate = (
    lang: string,
    key: L10nKey,
    params?: Record<string, string | number>,
  ): string => {
    let translations = this.langs[lang];
    if (!translations) {
      this.logger.warning('noLang', {key, lang});
      translations = this.langs.en;

      if (!translations) {
        this.logger.error('noEnglish', {key, lang});
        return `%${key}%L%`;
      }
    }

    let message = translations[key];
    if (!message) {
      message = this.langs.en?.[key];

      if (message) {
        this.logger.trace('noTranslation', {key, lang});
      } else {
        this.logger.error('noTranslation', {
          key,
          lang: 'en',
          originalLang: lang,
        });
        return getNoTranslationText(key);
      }
    }

    const formatted = message.format(params);

    if (typeof formatted !== 'string') {
      this.logger.error('badFormat', {key, lang}, {extra: formatted});
      return `%${key}%F%`;
    }

    return formatted;
  };

  getLanguagesList = (): string[] => {
    return Object.keys(this.langs);
  };
}
