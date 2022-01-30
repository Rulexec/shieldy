import 'module-alias/register';
import {localizations} from '@root/helpers/localizations';
import {writeFileSync, readdirSync, readFileSync} from 'fs';
import PO from 'pofile';

const l10nPath = `${__dirname}/../../l10n`;

type LangCode = string;
type L10nKey = string;

const languages = new Map<LangCode, Map<L10nKey, string>>();
const getLanguage = (lang: string) => {
  let languageKeys = languages.get(lang);
  if (!languageKeys) {
    languageKeys = new Map();
    languages.set(lang, languageKeys);
  }

  return languageKeys;
};

readdirSync(l10nPath).forEach((name) => {
  const match = /^([a-z]+)\.po$/.exec(name);
  if (!match) {
    return;
  }

  const [, lang] = match;

  const content = readFileSync(`${l10nPath}/${name}`, {encoding: 'utf8'});
  const po = PO.parse(content);

  const langKeys = getLanguage(lang);

  po.items.forEach((item) => {
    if (item.msgstr.length !== 1) {
      throw new Error('multiple msgstr not supported: ' + item.msgid);
    }

    langKeys.set(item.msgid, item.msgstr[0]);
  });
});

for (const [key, obj] of Object.entries(localizations)) {
  for (const [lang, translation] of Object.entries(obj)) {
    let languageKeys = languages.get(lang);
    if (!languageKeys) {
      languageKeys = new Map();
      languages.set(lang, languageKeys);
    }

    languageKeys.set(key, translation);
  }
}

languages.forEach((keys, lang) => {
  const keysList = Array.from(keys.entries());

  keysList.sort(([a], [b]) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  const content =
    keysList
      .map(([key, value]) => {
        const str = value.replace(/Shieldy/g, 'Sesuritu');

        return `msgid "${escape(key)}"\nmsgstr "${escape(str)}"`;
      })
      .join('\n\n') + '\n';

  writeFileSync(`${__dirname}/../../l10n/${lang}.po`, content);
});

function escape(key: string): string {
  // I don't know valid this or not, will see
  const json = JSON.stringify(key);
  return json.slice(1, json.length - 1);
}
