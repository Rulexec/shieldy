import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {setupTest} from '../helpers/setup';
import {createCallbackQuery, createMessage} from '../test-data/updates';

describe('/captcha', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should set captcha type', async () => {
    const {
      handleUpdate,
      onIdle,
      popMessages,
      popMessageEdits,
      unixSeconds,
      user,
      groupChat,
    } = await botTest.init();

    const COMMAND_MESSAGE_ID = 1;
    const REPLY_MESSAGE_ID = 2;

    await handleUpdate(
      createMessage({
        messageId: COMMAND_MESSAGE_ID,
        user,
        chat: groupChat,
        unixSeconds,
        text: '/captcha',
        isBotCommand: true,
      }),
    );
    await onIdle();

    let selectCaptchaTypeMessage;

    {
      // validate answer with keyboard
      const messages = popMessages();

      expect(messages.length).toBe(1);
      selectCaptchaTypeMessage = messages[0];

      expect(selectCaptchaTypeMessage.chatId).toBe(groupChat.id);
      expect(selectCaptchaTypeMessage.text).toBe(
        getNoTranslationText(T_`captcha`),
      );

      expect(selectCaptchaTypeMessage.replyToMessageId).toBe(
        COMMAND_MESSAGE_ID,
      );
      expect(Array.isArray(selectCaptchaTypeMessage.inlineKeyboard)).toBe(true);

      const customVariant = selectCaptchaTypeMessage.inlineKeyboard?.find(
        (key) => key.callbackData === 'custom',
      );
      expect(customVariant).toBeTruthy();
      expect(customVariant?.text).toBe(getNoTranslationText(T_`custom`));
    }

    await handleUpdate(
      createCallbackQuery({
        message: {
          ...selectCaptchaTypeMessage,
          date: unixSeconds,
          chat: groupChat,
          message_id: REPLY_MESSAGE_ID,
        },
        user,
        data: 'custom',
      }),
    );
    await onIdle();

    {
      expect(popMessages().length).toBe(0);

      const edits = popMessageEdits();
      expect(edits.length).toBe(1);

      expect(edits[0]).toEqual({
        chatId: groupChat.id,
        messageId: REPLY_MESSAGE_ID,
        text: `${getNoTranslationText(
          T_`captcha_selected`,
        )} (${getNoTranslationText(T_`custom`)})`,
      });
    }
  });
});
