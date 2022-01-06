import {setupTest} from '../helpers/setup';
import {createMessage} from '../test-data/updates';

describe('/source', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should do nothing if received not from admin', async () => {
    const {handleUpdate, onIdle, unixSeconds, user, groupChat} =
      await botTest.init();

    const someMessage = createMessage({
      user,
      chat: groupChat,
      unixSeconds,
      text: 'some text',
    });

    await handleUpdate(
      createMessage({
        user,
        chat: groupChat,
        unixSeconds,
        text: '/source',
        replyToMessage: {message: someMessage, user},
        isBotCommand: true,
      }),
    );
    await onIdle();
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
