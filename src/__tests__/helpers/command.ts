import {findChatById} from '@root/helpers/find-chat';
import {L10nKey} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {Chat} from '@root/models/Chat';
import {Database} from '@root/types/database';
import {createMessage} from '../test-data/updates';
import {setupTest} from './setup';

type BotTest = ReturnType<typeof setupTest>;
type TestInitData = ReturnType<BotTest['init']> extends Promise<infer Q>
  ? Q
  : never;
type ChatKey = keyof Chat;

export const testCommandChangingDatabase = async ({
  botTest,
  command,
  initialProperties,
  validate,
  getReplyText,
}: {
  botTest: BotTest;
  command: string;
  initialProperties: (options: {
    testInitData: TestInitData;
  }) => Parameters<Database['setChatProperty']>[0][];
  validate: (options: {
    testInitData: TestInitData;
    numberOfCalls: number;
  }) => Promise<boolean>;
  getReplyText: (options: {
    testInitData: TestInitData;
    numberOfCalls: number;
  }) => string;
}) => {
  const testInitData = await botTest.init();
  const {
    appContext,
    handleUpdate,
    onIdle,
    popMessages,
    unixSeconds,
    user,
    groupChat,
  } = testInitData;

  const {database} = appContext;

  await findChatById(appContext, groupChat.id);
  await Promise.all(
    initialProperties({testInitData}).map((prop) =>
      database.setChatProperty(prop),
    ),
  );

  await handleUpdate(
    createMessage({
      user,
      chat: groupChat,
      unixSeconds,
      text: command,
      isBotCommand: true,
    }),
  );
  await onIdle();

  let opts = {testInitData, numberOfCalls: 1};

  expect(await validate(opts)).toBe(true);

  {
    const messages = popMessages();
    expect(messages.length).toBe(1);
    expect(messages[0].chatId).toBe(groupChat.id);
    expect(messages[0].text).toBe(getReplyText(opts));
  }

  await handleUpdate(
    createMessage({
      user,
      chat: groupChat,
      unixSeconds,
      text: command,
      isBotCommand: true,
    }),
  );
  await onIdle();

  opts = {testInitData, numberOfCalls: 2};

  expect(await validate(opts)).toBe(true);

  {
    const messages = popMessages();
    expect(messages.length).toBe(1);
    expect(messages[0].chatId).toBe(groupChat.id);
    expect(messages[0].text).toBe(getReplyText(opts));
  }
};

export const testTrivialBooleanCommandChangingDatabase = ({
  botTest,
  command,
  property,
  replyFalseKey,
  replyTrueKey,
}: {
  botTest: BotTest;
  command: string;
  property: ChatKey;
  replyFalseKey: L10nKey;
  replyTrueKey: L10nKey;
}) =>
  testCommandChangingDatabase({
    botTest,
    command,
    initialProperties: ({testInitData: {groupChat}}) => [
      {
        chatId: groupChat.id,
        property,
        value: false,
      },
    ],
    validate: async ({
      testInitData: {
        groupChat,
        appContext: {database},
      },
      numberOfCalls,
    }) =>
      (await database.getChatById(groupChat.id))?.[property] ===
      (numberOfCalls % 2 ? true : false),
    getReplyText: ({numberOfCalls}) =>
      numberOfCalls % 2
        ? getNoTranslationText(replyTrueKey)
        : getNoTranslationText(replyFalseKey),
  });
