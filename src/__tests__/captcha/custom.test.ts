import {findChatById} from '@root/helpers/find-chat';
import {CaptchaType} from '@root/models/Chat';
import {getUniqueCounterValue} from '@root/util/id/unique-counter';
import {setupTest} from '../helpers/setup';
import {
  createChatMemberChange,
  createMessage,
  createNewChatMemberMessage,
} from '../test-data/updates';

describe('custom captcha', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it.each([
    {name: 'should ask for custom question'},
    {name: 'should ask for custom question, multianswer', isMultianswer: true},
    {name: 'should ask for custom question, degradated', isDegradated: true},
    {name: 'should ask for custom question, silent', isSilent: true},
  ])('$name', async ({isMultianswer, isDegradated, isSilent = false}) => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMessages,
      popMessageDeletes,
      unixSeconds,
      user,
      groupChat,
    } = await botTest.init();

    await findChatById(appContext, groupChat.id);

    await Promise.all([
      appContext.database.setChatProperty({
        chatId: groupChat.id,
        property: 'captchaType',
        value: CaptchaType.CUSTOM,
      }),
      appContext.database.setChatProperty({
        chatId: groupChat.id,
        property: 'silentMessages',
        value: isSilent,
      }),
    ]);

    if (!isDegradated) {
      await appContext.database.setChatProperty({
        chatId: groupChat.id,
        property: 'customCaptchaVariants',
        value: [
          {
            question: 'Say my name',
            answer: isMultianswer ? 'heisenberg,jack' : 'heisenberg',
          },
        ],
      });
    }

    const NEW_CHAT_MEMBER_MESSAGE_ID = 1001;

    await handleUpdate(
      createChatMemberChange({
        user,
        chat: groupChat,
        unixSeconds,
        fromStatus: 'left',
        toStatus: 'member',
      }),
    );
    await handleUpdate(
      createNewChatMemberMessage({
        user,
        chat: groupChat,
        messageId: NEW_CHAT_MEMBER_MESSAGE_ID,
        unixSeconds,
      }),
    );
    await onIdle();

    // Why it is deleted with `deleteEntryMessages: false`?
    expect(popMessageDeletes()).toEqual([
      {chatId: groupChat.id, messageId: NEW_CHAT_MEMBER_MESSAGE_ID},
    ]);

    if (isDegradated) {
      await checkDegradated();
    } else {
      await checkCustom();
    }

    // If this message will be deleted, test will fail with unprocessed events
    await handleUpdate(
      createMessage({
        user,
        chat: groupChat,
        unixSeconds,
        text: 'allowed message',
      }),
    );
    await onIdle();

    async function checkCustom() {
      let captchaMessageId: number;

      {
        // Check captcha message
        const messages = popMessages();
        expect(messages.length).toBe(1);

        const message = messages[0];

        captchaMessageId = message.messageId;

        expect(message.chatId).toBe(groupChat.id);
        expect(message.text).toBe(
          `<a href="tg://user?id=${user.id}">@${user.username}</a>, Say my name (60 sec)`,
        );
        expect(Boolean(message.isSilent)).toBe(isSilent);
      }

      for (let i = 0; i < 2; i++) {
        const anyMessageId = getUniqueCounterValue();

        await handleUpdate(
          createMessage({
            messageId: anyMessageId,
            user,
            chat: groupChat,
            unixSeconds,
            text: 'any message',
          }),
        );
        await onIdle();

        {
          // Check that message removed, captcha is not passed
          const deletedMessages = popMessageDeletes();

          const shouldBeDeleted = new Set([anyMessageId]);

          deletedMessages.forEach(({messageId}) => {
            expect(shouldBeDeleted.has(messageId)).toBe(true);
            shouldBeDeleted.delete(messageId);
          });

          expect(shouldBeDeleted.size).toBe(0);
        }
      }

      const answerMessageId = getUniqueCounterValue();

      await handleUpdate(
        createMessage({
          messageId: answerMessageId,
          user,
          chat: groupChat,
          unixSeconds,
          text: isMultianswer ? 'Jack' : 'Heisenberg',
        }),
      );
      await onIdle();

      {
        // Check that captcha messages are removed
        const deletedMessages = popMessageDeletes();

        const shouldBeDeleted = new Set([captchaMessageId, answerMessageId]);

        deletedMessages.forEach(({messageId}) => {
          expect(shouldBeDeleted.has(messageId)).toBe(true);
          shouldBeDeleted.delete(messageId);
        });

        expect(shouldBeDeleted.size).toBe(0);
      }
    }

    async function checkDegradated() {
      let captchaMessageId: number;

      {
        // Check captcha message
        const messages = popMessages();
        expect(messages.length).toBe(1);

        const message = messages[0];

        captchaMessageId = message.messageId;

        expect(message.chatId).toBe(groupChat.id);
        expect(message.text).toBe(
          `<a href="tg://user?id=${user.id}">@${user.username}</a>, please, send ` +
            'any message to this group within the time amount specified, otherwise ' +
            'you will be kicked. Thank you! (60 sec)',
        );
        expect(Boolean(message.isSilent)).toBe(isSilent);
      }

      const anyMessageId = getUniqueCounterValue();

      await handleUpdate(
        createMessage({
          messageId: anyMessageId,
          user,
          chat: groupChat,
          unixSeconds,
          text: 'any message',
        }),
      );
      await onIdle();

      {
        // Check that captcha messages are removed
        const deletedMessages = popMessageDeletes();

        const shouldBeDeleted = new Set([captchaMessageId, anyMessageId]);

        deletedMessages.forEach(({messageId}) => {
          expect(shouldBeDeleted.has(messageId)).toBe(true);
          shouldBeDeleted.delete(messageId);
        });

        expect(shouldBeDeleted.size).toBe(0);
      }
    }
  });
});
