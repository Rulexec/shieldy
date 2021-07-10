import {Language} from '@models/Chat';
import {localizations} from '@helpers/localizations';
import {AppContext} from '@root/types/app-context';

export function strings(
  appContext: AppContext,
  language: Language,
  key: string,
): string {
  const {
    config: {telegramAdminNickName},
    logger,
  } = appContext;

  let notFoundText = '🤔 Localization not found';

  if (telegramAdminNickName) {
    notFoundText += `, please, contact @${telegramAdminNickName}.

Локализация не найдена, пожалуйста, напишите @${telegramAdminNickName}.`;
  }

  const phrase = localizations[key];
  if (!phrase) {
    logger.error('noTranslation', {key});
    return notFoundText;
  }

  // Check for string type to allow empty phrases
  if (typeof phrase[language] === 'string') {
    return phrase[language];
  }

  if (typeof phrase.en === 'string') {
    return phrase.en;
  }

  return notFoundText;
}

export * from '@helpers/localizations';
