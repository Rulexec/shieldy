import {AppContext} from '@root/types/app-context';
import {Logger} from '@root/util/logging/types';
import {measureDuration} from '@root/util/stats/duration-logger';
import {executeMiddlewares} from './middleware';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from './types';

export const initBotMiddlewaresEngine = (appContext: AppContext): void => {
  const {telegrafBot, idling, logger: rootLogger} = appContext;

  // bot commands are in lower case
  const botCommands: Record<string, {middlewares: BotMiddlewareFn[]}> = {};
  const botCallbackQueryMap: Record<string, {middlewares: BotMiddlewareFn[]}> =
    {};
  const botCallbackQueryList: {
    regexp: RegExp;
    middlewares: BotMiddlewareFn[];
  }[] = [];
  const botMiddlewares: BotMiddlewareFn[] = [];

  let logger: Logger | null = null;
  const getLogger = (): Logger => {
    const {logger: newRootLogger} = appContext;

    if (!logger || newRootLogger.getKey() !== rootLogger.getKey()) {
      logger = rootLogger.fork('middlewares');
      return logger;
    }

    return logger;
  };

  telegrafBot.use((ctx, next) => {
    const logger = getLogger();

    const logTime = measureDuration({
      name: 'handleFull',
      logger,
      props: {updateType: ctx.updateType},
    });
    const finish = idling.startTask();

    (async () => {
      const middlewareResult = await executeMiddlewares({
        ctx,
        middlewares: botMiddlewares,
      });

      switch (middlewareResult) {
        case BotMiddlewareNextStrategy.next:
          break;
        case BotMiddlewareNextStrategy.abort:
          return BotMiddlewareNextStrategy.abort;
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const never: never = middlewareResult;
          break;
        }
      }

      // Middlewares are processed, if all are passed execution flow,
      // try to parse and process bot command
      const commandsResult = await (async () => {
        const messageText = ctx.message?.text;
        if (!messageText) {
          return BotMiddlewareNextStrategy.next;
        }

        const match = /^\/([^\s@]+)(?:@([^\s]+))?/.exec(messageText);
        if (!match) {
          return BotMiddlewareNextStrategy.next;
        }

        const [, commandName, botName] = match;
        if (botName) {
          if (!ctx.me) {
            // Better ignore commands not to this bot, than reply to any if we don't know own nickname
            return BotMiddlewareNextStrategy.abort;
          }

          if (botName.toLowerCase() !== ctx.me.toLowerCase()) {
            return BotMiddlewareNextStrategy.abort;
          }
        }

        const commandDef = botCommands[commandName.toLowerCase()];
        if (!commandDef) {
          return BotMiddlewareNextStrategy.next;
        }

        await executeMiddlewares({
          ctx,
          middlewares: commandDef.middlewares,
        });

        return BotMiddlewareNextStrategy.abort;
      })();

      switch (commandsResult) {
        case BotMiddlewareNextStrategy.next:
          break;
        case BotMiddlewareNextStrategy.abort:
          return BotMiddlewareNextStrategy.abort;
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const never: never = commandsResult;
          break;
        }
      }

      // If this update is not command, try to parse callback query
      return await (async () => {
        const queryData = ctx.callbackQuery?.data;
        if (!queryData) {
          return BotMiddlewareNextStrategy.next;
        }

        let queryDef = botCallbackQueryMap[queryData];
        if (!queryDef) {
          botCallbackQueryList.some((def) => {
            if (def.regexp.test(queryData)) {
              queryDef = def;
              return true;
            }
          });

          if (!queryDef) {
            return BotMiddlewareNextStrategy.next;
          }
        }

        return await executeMiddlewares({
          ctx,
          middlewares: queryDef.middlewares,
        });
      })();
    })()
      .then(
        (result) => {
          switch (result) {
            case BotMiddlewareNextStrategy.next:
              break;
            case BotMiddlewareNextStrategy.abort:
              return;
            default: {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const never: never = result;
              break;
            }
          }

          next();
        },
        (error) => {
          logger.error('middleware', undefined, {error});
          return BotMiddlewareNextStrategy.abort;
        },
      )
      .finally(() => {
        finish();
        logTime();
      });
  });

  appContext.addBotCommand = (command, ...middlewares) => {
    if (Array.isArray(command)) {
      command.forEach((cmd) => {
        botCommands[cmd.toLowerCase()] = {middlewares};
      });
    } else {
      botCommands[command.toLowerCase()] = {middlewares};
    }
  };
  appContext.addBotCallbackQuery = (query, ...middlewares) => {
    if (Array.isArray(query)) {
      query.forEach((name) => {
        botCallbackQueryMap[name] = {middlewares};
      });
    } else if (typeof query === 'string') {
      botCallbackQueryMap[query] = {middlewares};
    } else {
      botCallbackQueryList.push({regexp: query, middlewares});
    }
  };
  appContext.prependBotMiddleware = (middleware) => {
    botMiddlewares.unshift(middleware);
  };
  appContext.addBotMiddleware = (middleware) => {
    botMiddlewares.push(middleware);
  };
};
