import {AppContext} from '@root/types/app-context';
import {sleep} from '@root/util/async/sleep';
import {Logger} from '@root/util/logging/types';
import {
  CommandDef,
  getCommandTelegramCommandScopes,
  TelegramCommandScopeObject,
  TelegramCommandScopeType,
} from './all-commands';

type Scope = {
  telegramScope: TelegramCommandScopeObject;
  commands: CommandDef[];
};

export const telegramSetMyCommands = async ({
  appContext: {commandDefinitions, translations, telegrafBot},
  logger,
}: {
  appContext: AppContext;
  logger: Logger;
}) => {
  const scopes = new Map<TelegramCommandScopeType, Scope>();

  commandDefinitions.forEach((commandDef) => {
    const commandScopes = getCommandTelegramCommandScopes(commandDef);

    commandScopes.forEach((telegramScope) => {
      let obj = scopes.get(telegramScope.type);
      if (!obj) {
        obj = {
          telegramScope,
          commands: [],
        };
        scopes.set(telegramScope.type, obj);
      }

      obj.commands.push(commandDef);
    });
  });

  const tasks: ((options: {tasksLeft: number}) => Promise<unknown>)[] = [];

  translations.getLanguagesList().forEach((lang) => {
    // FIXME: Invalid languages
    switch (lang) {
      case 'yue':
        return;
    }

    scopes.forEach((scope) => {
      const commands: any[] = [];

      scope.commands.forEach(({key, helpDescription}) => {
        if (!helpDescription) {
          return;
        }

        commands.push({
          // Looks like telegram doesn't like camelCase commands
          command: key.toLowerCase(),
          description: translations.translate(lang, helpDescription),
        });
      });

      const callApi = () =>
        telegrafBot.telegram
          .callApi('setMyCommands', {
            commands,
            scope: scope.telegramScope,
            language_code: lang,
          })
          .catch((error) => {
            logger.error(
              'api',
              {lang, scope: scope.telegramScope.type},
              {extra: error, error},
            );
            throw error;
          });

      tasks.push(async ({tasksLeft}) => {
        await callApi();
        logger.trace('set', {
          lang,
          scope: scope.telegramScope.type,
          tasksLeft,
        });
      });
    });
  });

  let tasksLeft = tasks.length;
  logger.trace('start', {count: tasksLeft});

  for (const task of tasks) {
    tasksLeft--;
    await task({tasksLeft});
    await sleep(5000);
  }

  logger.trace('finish');
};
