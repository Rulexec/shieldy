import {AppContext} from '@root/types/app-context';
import {createTestAppContext} from '@root/__tests__/helpers/create-context';
import {T_} from './l10n-key';
import {Translations} from './translations';

/* eslint-disable local-rules/validate-l10n */

const identity = <T extends unknown>(x: T): T => x;

describe('Translations', () => {
  let appContext: AppContext;
  let translations: Translations;

  beforeEach(async () => {
    ({appContext} = createTestAppContext({
      createTranslations: ({appContext}) =>
        new Translations({
          getTranslationsLoader: () => () =>
            Promise.resolve([
              {
                lang: 'en',
                translations: identity({
                  test: 'passed',
                  fallback: 'fallback here!',
                }),
              },
              {
                lang: 'ru',
                translations: identity({
                  test: 'прошёл',
                }),
              },
            ]),
          logger: appContext.logger.fork('l10n'),
        }),
    }));

    translations = appContext.translations;

    await translations.init({appContext});
  });

  afterEach(async () => {
    await appContext.stop();
  });

  it('should translate', () => {
    expect(translations.translate('en', T_`test`)).toBe('passed');
    expect(translations.translate('ru', T_`test`)).toBe('прошёл');
  });

  it('should fallback to English if no translation in requested lang', () => {
    expect(translations.translate('en', T_`fallback`)).toBe('fallback here!');
    expect(translations.translate('ru', T_`fallback`)).toBe('fallback here!');

    // non-existing language
    expect(translations.translate('!!', T_`fallback`)).toBe('fallback here!');
  });

  it('should return gibberish if English is not loaded', async () => {
    const translations = new Translations({
      getTranslationsLoader: () => () => Promise.resolve([]),
      logger: appContext.logger.fork('l10n'),
    });
    await translations.init({appContext});

    expect(translations.translate('!!', T_`test`)).toBe('%test%L%');
  });

  it('should return gibberish if no such key', () => {
    expect(translations.translate('ru', T_`non_existing_key`)).toBe(
      '%non_existing_key%T%',
    );
  });
});
