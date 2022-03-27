import {L10nKey} from '@sesuritu/types/src/i18n/l10n-key';

export const getNoTranslationText = (key: L10nKey): string => `%${key}%T%`;
