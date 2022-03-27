import {findChatById} from '@root/helpers/find-chat';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {getUniqueCounterValue} from '@sesuritu/util/src/id/unique-counter';
import {setupTest} from '../helpers/setup';
import {createMessage} from '../test-data/updates';

describe('/silent', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should toggle silent notifications', async () => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMessages,
      unixSeconds,
      user,
      groupChat,
    } = await botTest.init();

    await findChatById(appContext, groupChat.id);
    await appContext.database.setChatProperty({
      chatId: groupChat.id,
      property: 'silentMessages',
      value: false,
    });

    const checkSilentPing = async (expectedSilent: boolean) => {
      await handleUpdate(
        createMessage({
          messageId: getUniqueCounterValue(),
          user,
          chat: groupChat,
          unixSeconds,
          text: '/ping',
          isBotCommand: true,
        }),
      );
      await onIdle();

      {
        const messages = popMessages();

        expect(messages.length).toBe(1);
        expect(messages[0].text).toBe('pong');
        expect(Boolean(messages[0].isSilent)).toBe(expectedSilent);
      }
    };

    await checkSilentPing(false);

    await handleUpdate(
      createMessage({
        messageId: getUniqueCounterValue(),
        user,
        chat: groupChat,
        unixSeconds,
        text: '/silent',
        isBotCommand: true,
      }),
    );
    await onIdle();

    {
      // Should change to silent
      const messages = popMessages();

      expect(messages.length).toBe(1);
      expect(messages[0].text).toBe(
        getNoTranslationText(T_`silentMessages_true`),
      );
      expect(messages[0].isSilent).toBeTruthy();
    }

    await checkSilentPing(true);

    await handleUpdate(
      createMessage({
        messageId: getUniqueCounterValue(),
        user,
        chat: groupChat,
        unixSeconds,
        text: '/silent',
        isBotCommand: true,
      }),
    );
    await onIdle();

    {
      // Should change to not silent
      const messages = popMessages();

      expect(messages.length).toBe(1);
      expect(messages[0].text).toBe(
        getNoTranslationText(T_`silentMessages_false`),
      );
      expect(messages[0].isSilent).toBeFalsy();
    }

    await checkSilentPing(false);
  });
});
