import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {setupTest} from '../helpers/setup';
import {createMessage} from '../test-data/updates';

describe('/help', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should reply with help', async () => {
    const {handleUpdate, onIdle, popMessages, unixSeconds, user, groupChat} =
      await botTest.init();

    await handleUpdate(
      createMessage({
        user,
        chat: groupChat,
        unixSeconds,
        text: '/help',
        isBotCommand: true,
      }),
    );

    await onIdle();

    const messages = popMessages();

    expect(messages.length).toBe(1);

    const message = messages[0];

    expect(message.chatId).toBe(groupChat.id);
    expect(message.text).toContain(getNoTranslationText(T_`help_start`));
    expect(message.text).toContain(getNoTranslationText(T_`help_end`));
  });
});
