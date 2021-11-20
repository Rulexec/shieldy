import {setupTest} from '../helpers/setup';
import {createMessage} from '../test-data/updates';

describe('/help', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  [true, false].forEach((isPrivateChat) => {
    it(
      // eslint-disable-next-line jest/valid-title
      isPrivateChat
        ? 'should reply that it is private chat'
        : 'should reply with help',
      async () => {
        const {
          handleUpdate,
          onIdle,
          popMessages,
          unixSeconds,
          user,
          privateChat,
          groupChat,
        } = await botTest.init();

        const chat = isPrivateChat ? privateChat : groupChat;

        await handleUpdate(
          createMessage({
            user,
            chat,
            unixSeconds,
            text: '/help',
            isBotCommand: true,
          }),
        );

        await onIdle();

        const messages = popMessages();

        expect(messages.length).toBe(isPrivateChat ? 2 : 1);

        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];

        if (isPrivateChat) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(firstMessage.chatId).toBe(chat.id);
          // eslint-disable-next-line jest/no-conditional-expect
          expect(firstMessage.text).toMatch(
            /You are changing the settings in private messages/,
          );
        }

        expect(lastMessage.chatId).toBe(chat.id);
        expect(lastMessage.text).toMatch(
          /Sesuritu — is the best solution in Telegram to fight annoying spammers/,
        );
      },
    );
  });
});
