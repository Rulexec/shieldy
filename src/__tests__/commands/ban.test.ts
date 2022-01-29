import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {setupTest} from '../helpers/setup';
import {createMessage} from '../test-data/updates';

describe('/ban', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should kick user', async () => {
    const {
      handleUpdate,
      onIdle,
      popMessages,
      popMemberKicks,
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

    await handleUpdate(
      createMessage({
        user: adminUser,
        chat: groupChat,
        unixSeconds,
        text: '/ban',
        replyToMessage: {message: someMessage, user},
        isBotCommand: true,
      }),
    );
    await onIdle();

    {
      const messages = popMessages();
      expect(messages).toStrictEqual([
        {
          ...messages[0],
          chatId: groupChat.id,
          text: getNoTranslationText(T_`trust_success`),
        },
      ]);
    }

    expect(popMemberKicks()).toStrictEqual([
      {chatId: groupChat.id, userId: user.id},
    ]);
  });
});
