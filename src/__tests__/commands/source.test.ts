import {findChatById} from '@root/helpers/find-chat';
import {setupTest} from '../helpers/setup';
import {createMessage} from '../test-data/updates';

describe('/source', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should do nothing if received not from admin and bot is locked', async () => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMessageDeletes,
      unixSeconds,
      user,
      groupChat,
    } = await botTest.init();

    const {database} = appContext;

    await findChatById(appContext, groupChat.id);
    await database.setChatProperty({
      chatId: groupChat.id,
      property: 'adminLocked',
      value: true,
    });

    const someMessage = createMessage({
      user,
      chat: groupChat,
      unixSeconds,
      text: 'some text',
    });

    const commandMessage = createMessage({
      user,
      chat: groupChat,
      unixSeconds,
      text: '/source',
      replyToMessage: {message: someMessage, user},
      isBotCommand: true,
    });

    await handleUpdate(commandMessage);
    await onIdle();

    expect(popMessageDeletes()).toStrictEqual([
      {chatId: groupChat.id, messageId: commandMessage.message.message_id},
    ]);
  });

  it('should reply with quoted message json', async () => {
    const {
      handleUpdate,
      onIdle,
      popMessages,
      popMessageDeletes,
      unixSeconds,
      user,
      adminUser,
      groupChat,
    } = await botTest.init();

    const someMessage = createMessage({
      user,
      chat: groupChat,
      unixSeconds,
      text: 'some text',
    });

    const commandMessage = createMessage({
      user: adminUser,
      chat: groupChat,
      unixSeconds,
      text: '/source',
      replyToMessage: {message: someMessage, user},
      isBotCommand: true,
    });

    await handleUpdate(commandMessage);
    await onIdle();

    const actualMessages = popMessages();

    expect(actualMessages.length).toBe(1);
    expect(actualMessages[0].text).toMatch(/^<code>[^]*<\/code>$/);

    expect(popMessageDeletes()).toStrictEqual([
      {chatId: groupChat.id, messageId: commandMessage.message.message_id},
    ]);
  });
});
