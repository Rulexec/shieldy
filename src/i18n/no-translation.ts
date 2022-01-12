import {L10nKey} from './l10n-key';

export const getNoTranslationText = (key: L10nKey): string => `%${key}%T%`;
