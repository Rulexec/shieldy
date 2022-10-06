import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {setupTest} from '../helpers/setup';
import {Message} from '../test-data/types';
import {createMessage} from '../test-data/updates';

describe('/addCustomCaptcha', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should add custom captcha variants, view them and remove', async () => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMessages,
      unixSeconds,
      user,
      botUser,
      groupChat,
    } = await botTest.init();

    const addQuestionAndAnswer = async (question: string, answer: string) => {
      await handleUpdate(
        createMessage({
          user,
          chat: groupChat,
          unixSeconds,
          text: '/addCustomCaptcha',
          isBotCommand: true,
        }),
      );
      await onIdle();

      let questionMessage: Message;

      {
        const messages = popMessages();

        expect(messages.length).toBe(3);
        expect(messages.map((x) => x.text)).toEqual([
          getNoTranslationText(T_`custom_add_question`),
          getNoTranslationText(T_`thisIsNotAReply`),
          getNoTranslationText(T_`thisIsAReply`),
        ]);
        expect(messages[2].replyToMessageId).toBe(messages[1].messageId);

        questionMessage = messages[0];
      }

      await handleUpdate(
        createMessage({
          user,
          chat: groupChat,
          unixSeconds,
          text: question,
          replyToMessage: {message: questionMessage, user: botUser},
        }),
      );
      await onIdle();

      let answerMessage: Message;

      {
        const messages = popMessages();

        expect(messages.length).toBe(1);
        expect(messages.map((x) => x.text)).toEqual([
          getNoTranslationText(T_`custom_add_answer`),
        ]);

        answerMessage = messages[0];
      }

      await handleUpdate(
        createMessage({
          user,
          chat: groupChat,
          unixSeconds,
          text: answer,
          replyToMessage: {message: answerMessage, user: botUser},
        }),
      );
      await onIdle();

      {
        const messages = popMessages();

        expect(messages.length).toBe(1);
        expect(messages.map((x) => x.text)).toEqual([
          getNoTranslationText(T_`custom_success`),
        ]);
      }
    };

    await addQuestionAndAnswer('Say my name', ' heisenberg, john   ,Sesuritu');
    await addQuestionAndAnswer('Say not my name', '"not my name"');

    const chat = await appContext.database.getChatById(groupChat.id);

    expect(chat).not.toBeNull();
    assertNonNullish(chat);

    expect(Array.isArray(chat.customCaptchaVariants)).toBe(true);
    expect(
      chat.customCaptchaVariants.slice().sort((a, b) => {
        if (a.question <= b.question) return -1;
        else return 1;
      }),
    ).toEqual([
      {id: 1, question: 'Say my name', answer: 'heisenberg,john,sesuritu'},
      {id: 2, question: 'Say not my name', answer: '"not my name"'},
    ]);

    await handleUpdate(
      createMessage({
        user,
        chat: groupChat,
        unixSeconds,
        text: '/viewCustomCaptcha',
        isBotCommand: true,
      }),
    );
    await onIdle();

    {
      const messages = popMessages();

      expect(messages.length).toBe(1);
      expect(messages.map((x) => x.text)).toEqual([
        `1. ${getNoTranslationText(
          T_`custom_question_colon`,
        )} Say my name\n${getNoTranslationText(
          T_`custom_answer_colon`,
        )} heisenberg,john,sesuritu\n\n` +
          `2. ${getNoTranslationText(
            T_`custom_question_colon`,
          )} Say not my name\n${getNoTranslationText(
            T_`custom_answer_colon`,
          )} "not my name"`,
      ]);
    }

    await handleUpdate(
      createMessage({
        user,
        chat: groupChat,
        unixSeconds,
        text: '/removeAllCustomCaptcha',
        isBotCommand: true,
      }),
    );
    await onIdle();

    {
      const messages = popMessages();

      expect(messages.length).toBe(1);
      expect(messages.map((x) => x.text)).toEqual([
        getNoTranslationText(T_`custom_removed`),
      ]);
    }

    const chatWithoutQuestions = await appContext.database.getChatById(
      groupChat.id,
    );

    expect(chatWithoutQuestions).not.toBeNull();
    assertNonNullish(chatWithoutQuestions);

    expect(chatWithoutQuestions.customCaptchaVariants.length).toBe(0);
  });
});
