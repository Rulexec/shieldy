// WARN: file used from eslint rule that works via ts-node, module aliases cannot be used there
import {readdir, readFile, readFileSync} from 'fs';
import {join as pathJoin} from 'path';
import PO from 'pofile';
import {promisify} from 'util';
import {
  TranslationLoader,
  TranslationLoaderSync,
} from './translations-loader-types';

const poContentToTranslations = (lang: string, content: string) => {
  const po = PO.parse(content);

  const translations: Record<string, string> = {};

  po.items.forEach((item) => {
    if (item.msgstr.length !== 1) {
      throw new Error('multiple msgstr not supported: ' + item.msgid);
    }

    translations[item.msgid] = item.msgstr[0];
  });

  return {lang, translations};
};

export const createFsPoTranslationsLoader = ({
  l10nFilesPath,
  langs: customLangs,
}: {
  l10nFilesPath: string;
  langs?: string[];
}): TranslationLoader => {
  return async () => {
    const langs =
      customLangs ||
      ((await promisify(readdir)(l10nFilesPath))
        .map((fileName) => {
          const match = /^([a-z]+)\.po$/.exec(fileName);
          if (!match) {
            return null;
          }

          const [, lang] = match;

          return lang;
        })
        .filter(Boolean) as string[]);

    const resultPromises = langs
      .map((lang) => {
        return {lang, path: pathJoin(l10nFilesPath, `${lang}.po`)};
      })
      .map(async ({lang, path}) => {
        const content = await promisify(readFile)(path, {encoding: 'utf8'});
        return poContentToTranslations(lang, content);
      });

    return Promise.all(resultPromises);
  };
};

export const createFsPoTranslationsLoaderSync = ({
  l10nFilesPath,
  langs,
}: {
  l10nFilesPath: string;
  langs: string[];
}): TranslationLoaderSync => {
  return () => {
    return langs.map((lang) => {
      const content = readFileSync(pathJoin(l10nFilesPath, `${lang}.po`), {
        encoding: 'utf8',
      });
      return poContentToTranslations(lang, content);
    });
  };
};
