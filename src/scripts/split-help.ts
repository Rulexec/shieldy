import 'module-alias/register';
import {createFsPoTranslationsLoader} from '@root/i18n/translations-loader-fs-po';
import _path from 'path';
import {readFileSync, writeFileSync} from 'fs';

const poLoader = createFsPoTranslationsLoader({
  l10nFilesPath: _path.join(__dirname, '../../l10n'),
});

(async () => {
  const translations = await poLoader();
  translations.forEach(({lang, translations}) => {
    if (!translations.helpShieldy) {
      return;
    }

    const helpStart: string[] = [];
    const helpEnd: string[] = [];

    let beforeCommands = true;
    let afterCommands = false;

    const strList = translations.helpShieldy
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => {
        if (!x) {
          return false;
        }

        const isCommand = /^\//.test(x);

        if (afterCommands && isCommand) {
          throw new Error(`[${lang}] Non-command in commands: ${x}`);
        }

        if (isCommand) {
          beforeCommands = false;
        } else if (beforeCommands) {
          helpStart.push(x);
        } else {
          helpEnd.push(x);
          afterCommands = true;
        }

        return isCommand;
      });

    const commands = strList.map((x) => {
      const match = /^\/([a-zA-Z]+)\s*[—\-–]\s*(.+)$/.exec(x);
      if (!match) {
        throw new Error(`[${lang}] Bad command: ${x}`);
      }

      const [, command, description] = match;

      const commandName = command.replace(/^\//, '');

      return {command: commandName, description};
    });

    const filePath = _path.join(__dirname, '../../l10n', `${lang}.po`);
    let content = readFileSync(filePath, {encoding: 'utf8'});

    if (content[content.length - 1] !== '\n') {
      content += '\n\n';
    } else if (content[content.length - 2] !== '\n') {
      content += '\n';
    }

    const addPhrase = (phraseKey: string, value: string): void => {
      if (content.includes(`"${phraseKey}"`)) {
        return;
      }

      content += `msgid "${phraseKey}"\nmsgstr "${escape(value)}"\n\n`;
    };

    addPhrase(`help_start`, helpStart.join('\n'));
    addPhrase(`help_end`, helpEnd.join('\n'));

    commands.forEach(({command, description}) => {
      addPhrase(`${command}_help`, description);
    });

    content = content.replace(/\n\n$/, '\n');

    writeFileSync(filePath, content, {encoding: 'utf8'});
  });
})();

function escape(key: string): string {
  // I don't know valid this or not, will see
  const json = JSON.stringify(key);
  return json.slice(1, json.length - 1);
}
