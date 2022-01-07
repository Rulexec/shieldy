import {AppContext} from '@root/types/app-context';
import {assertTypesEqual} from '@root/types/type-assert';
import {setupBot} from '@root/updateHandler';
import {sleep} from '@root/util/async/sleep';
import {getUniqueCounterValue} from '@root/util/id/unique-counter';
import {
  IdlingStatus,
  IdlingStatusOnIdleResult,
} from '@root/util/state/idling-status';
import {
  TEST_BOT_ID,
  TEST_BOT_USERNAME,
  TEST_TELEGRAM_TOKEN,
} from '../constants';
import {TelegramBotServer} from '../telegram-bot-server/server';
import {
  Chat,
  getGroupChat,
  getPrivateChat,
  getUser,
  User,
} from '../test-data/chats';
import {createTestAppContext} from './create-context';

type InitObj = {
  appContext: AppContext;
  popMessages: TelegramBotServer['popMessages'];
  popMessageEdits: TelegramBotServer['popMessageEdits'];
  popMessageDeletes: TelegramBotServer['popMessageDeletes'];
  popMemberKicks: TelegramBotServer['popMemberKicks'];
  onIdle: IdlingStatus['onIdle'];
  handleUpdate: (update: any) => Promise<void>;
  user: User;
  adminUser: User;
  botUser: User;
  otherBotUser: User;
  privateChat: Chat;
  groupChat: Chat;
  unixSeconds: number;
};

export {InitObj as BotTestHelpers};

export const setupTest = (): {
  init: () => Promise<InitObj>;
  afterEach: () => void;
} => {
  let appContext: AppContext | null = null;
  let telegram: TelegramBotServer | null = null;

  return {
    init: async () => {
      if (telegram) {
        throw new Error('only single telegram can exist');
      }

      const adminUserId = getUniqueCounterValue();

      const user = getUser(getUniqueCounterValue());
      const adminUser = getUser(adminUserId);
      const botUser = getUser(TEST_BOT_ID, {
        isBot: true,
        username: TEST_BOT_USERNAME,
      });
      const otherBotUser = getUser(getUniqueCounterValue(), {
        isBot: true,
        username: 'AnotherBot',
      });
      const privateChat = getPrivateChat(user);
      const groupChat = getGroupChat(-1 * getUniqueCounterValue());

      telegram = new TelegramBotServer({
        token: TEST_TELEGRAM_TOKEN,
        botId: TEST_BOT_ID,
        getUserById: (id) => {
          switch (id) {
            case user.id:
              return {user, status: 'member'};
            case adminUser.id:
              return {user: adminUser, status: 'administrator'};
            case botUser.id:
              return {user: botUser, status: 'administrator'};
            case otherBotUser.id:
              return {user: otherBotUser, status: 'member'};
          }

          return null;
        },
        getChatById: (id) => {
          if (id === groupChat.id) {
            return groupChat;
          } else if (id === privateChat.id) {
            return privateChat;
          }

          throw new Error(`Chat not found: ${id}`);
        },
        getCurrentTime: () => appContext!.getCurrentDate().getTime(),
      });
      await telegram.init();

      const date = new Date('2021-10-19T12:00:00.000Z');

      ({appContext} = createTestAppContext({
        telegramApiRoot: `http://127.0.0.1:${telegram.getPort()}`,
        initialTimestamp: date.getTime(),
      }));

      await appContext.init();

      const {telegrafBot: bot, idling} = appContext;

      setupBot(appContext);

      const botInfo = await bot.telegram.getMe();

      expect(botInfo.id).toBe(TEST_BOT_ID);

      bot.botInfo = botInfo;
      bot.options.username = botInfo.username;

      return {
        appContext,
        popMessages: telegram.popMessages,
        popMessageEdits: telegram.popMessageEdits,
        popMessageDeletes: telegram.popMessageDeletes,
        popMemberKicks: telegram.popMemberKicks,
        onIdle: async () => {
          const status = await idling.onIdle();
          if (status !== IdlingStatusOnIdleResult.sync) {
            return status;
          }

          assertTypesEqual<IdlingStatusOnIdleResult.sync, typeof status>(true);

          // skip promises inside telegraf
          await sleep(100);
          return await idling.onIdle();
        },
        handleUpdate: bot.handleUpdate.bind(bot),
        user,
        adminUser,
        botUser,
        otherBotUser,
        privateChat,
        groupChat,
        unixSeconds: Math.floor(date.getTime() / 1000),
      };
    },
    afterEach: async () => {
      let error;

      if (telegram) {
        if (telegram.popMessages().length) {
          error = new Error('non-null messages count');
        } else if (telegram.popMessageEdits().length) {
          error = new Error('non-null message edits count');
        } else if (telegram.popMessageDeletes().length) {
          error = new Error('non-null message deletes count');
        } else if (telegram.popMemberKicks().length) {
          error = new Error('non-null member kicks count');
        }

        await telegram.destroy();
        telegram = null;
      }

      if (appContext) {
        await appContext.stop();
        appContext = null;
      }

      if (error) {
        throw error;
      }
    },
  };
};
