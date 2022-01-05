import {readdir, readFile} from 'fs';
import {join as pathJoin} from 'path';
import PO from 'pofile';
import {promisify} from 'util';
import {TranslationLoader} from './translations-loader-types';

export const createFsPoTranslationsLoader = ({
  l10nFilesPath,
}: {
  l10nFilesPath: string;
}): TranslationLoader => {
  return async () => {
    const names = await promisify(readdir)(l10nFilesPath);

    const resultPromises = names
      .map((fileName) => {
        const match = /^([a-z]+)\.po$/.exec(fileName);
        if (!match) {
          return null;
        }

        const [, lang] = match;

        return {lang, path: pathJoin(l10nFilesPath, fileName)};
      })
      .filter(Boolean)
      .map(async ({lang, path}) => {
        const content = await promisify(readFile)(path, {encoding: 'utf8'});
        const po = PO.parse(content);

        const translations: Record<string, string> = {};

        po.items.forEach((item) => {
          if (item.msgstr.length !== 1) {
            throw new Error('multiple msgstr not supported: ' + item.msgid);
          }

          translations[item.msgid] = item.msgstr[0];
        });

        return {lang, translations: {}};
      });

    return Promise.all(resultPromises);
  };
};
