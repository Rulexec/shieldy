import {findChatById} from '@root/helpers/find-chat';
import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {CaptchaType} from '@root/models/Chat';
import {getUniqueCounterValue} from '@root/util/id/unique-counter';
import {BotTestHelpers, setupTest} from '../helpers/setup';
import {getUser, User} from '../test-data/chats';
import {Message} from '../test-data/types';
import {createChatMemberChange, createMessage} from '../test-data/updates';

type ExpectedMessageOptions = {newUser: User};

describe('/customCaptchaMessage', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it.each([
    {
      name: 'should add custom message to captcha',
      captchaType: CaptchaType.SIMPLE,
      customCaptchaMessage: 'Hello, $username',
      getExpectedMessage: ({newUser}: ExpectedMessageOptions) =>
        `Hello, @${newUser.username}`,
    },
    {
      name: 'should combine custom message with custom captcha',
      captchaType: CaptchaType.CUSTOM,
      customCaptchaMessage: 'Hello, $username',
      getExpectedMessage: ({newUser}: ExpectedMessageOptions) =>
        `Hello, <a href="tg://user?id=${newUser.id}">@${
          newUser.username
        }</a>, Say my name (60 ${getNoTranslationText(T_`seconds`)})`,
    },
    {
      name: 'should work without mentions',
      captchaType: CaptchaType.CUSTOM,
      customCaptchaMessage: 'Custom message',
      getExpectedMessage: ({newUser}: ExpectedMessageOptions) =>
        `<a href="tg://user?id=${newUser.id}">@${
          newUser.username
        }</a>, Custom message, Say my name (60 ${getNoTranslationText(
          T_`seconds`,
        )})`,
    },
  ])(
    '$name',
    async ({captchaType, customCaptchaMessage, getExpectedMessage}) => {
      const helpers = await botTest.init();
      const {
        appContext,
        handleUpdate,
        onIdle,
        popMessages,
        unixSeconds,
        groupChat,
      } = helpers;

      // Create chat
      await findChatById(appContext, groupChat.id);

      // Setup simple captcha type
      await Promise.all([
        appContext.database.setChatProperty({
          chatId: groupChat.id,
          property: 'captchaType',
          value: captchaType,
        }),
        ...(captchaType === CaptchaType.CUSTOM
          ? [
              appContext.database.setChatProperty({
                chatId: groupChat.id,
                property: 'customCaptchaVariants',
                value: [{id: 1, question: 'Say my name', answer: 'Heisenberg'}],
              }),
            ]
          : []),
      ]);

      // Setup custom captcha message via commands
      await testCustomCaptchaMessage({
        helpers,
        customCaptchaMessageText: customCaptchaMessage,
      });

      const newUser = getUser(getUniqueCounterValue());

      await handleUpdate(
        createChatMemberChange({
          user: newUser,
          chat: groupChat,
          unixSeconds,
          fromStatus: 'left',
          toStatus: 'member',
        }),
      );
      await onIdle();

      {
        const messages = popMessages();
        expect(messages.length).toBe(1);

        expect(messages[0].text).toBe(getExpectedMessage({newUser}));
      }
    },
  );
});

const testCustomCaptchaMessage = async ({
  helpers,
  customCaptchaMessageText,
}: {
  helpers: BotTestHelpers;
  customCaptchaMessageText: string;
}) => {
  const {
    handleUpdate,
    onIdle,
    popMessages,
    unixSeconds,
    user,
    botUser,
    groupChat,
  } = helpers;

  await handleUpdate(
    createMessage({
      messageId: getUniqueCounterValue(),
      user,
      chat: groupChat,
      unixSeconds,
      text: '/customCaptchaMessage',
      isBotCommand: true,
    }),
  );
  await onIdle();

  let customCaptchaMessage: Message;

  {
    const messages = popMessages();

    expect(messages.length).toBe(3);

    customCaptchaMessage = messages[0];

    expect(messages[0].text).toBe(
      getNoTranslationText(T_`captchaMessage_true`),
    );

    expect(messages[1].text).toBe(getNoTranslationText(T_`thisIsNotAReply`));
    expect(messages[1].replyToMessageId).toBeUndefined();

    expect(messages[2].text).toBe(getNoTranslationText(T_`thisIsAReply`));
    expect(messages[2].replyToMessageId).toBe(messages[1].messageId);
  }

  const replyMessageId = getUniqueCounterValue();

  await handleUpdate(
    createMessage({
      messageId: replyMessageId,
      replyToMessage: {message: customCaptchaMessage, user: botUser},
      user,
      chat: groupChat,
      unixSeconds,
      text: customCaptchaMessageText,
    }),
  );
  await onIdle();

  {
    const messages = popMessages();

    expect(messages.length).toBe(1);

    const {text, replyToMessageId} = messages[0];

    expect(text).toBe(getNoTranslationText(T_`greetsUsers_message_accepted`));
    expect(replyToMessageId).toBe(replyMessageId);
  }
};
