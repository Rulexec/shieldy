import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
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
          expect(firstMessage.text).toBe(
            getNoTranslationText(T_`commandsInPrivateWarning`),
          );
        }

        expect(lastMessage.chatId).toBe(chat.id);
        expect(lastMessage.text).toContain(
          getNoTranslationText(T_`help_start`),
        );
        expect(lastMessage.text).toContain(getNoTranslationText(T_`help_end`));
      },
    );
  });
});
