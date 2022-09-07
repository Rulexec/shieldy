import {checkUsersToKick} from '@root/helpers/check-users-to-kick';
import {findChatById} from '@root/helpers/find-chat';
import {T_} from '@root/i18n/l10n-key';
import {CaptchaType} from '@root/models/Chat';
import {getUniqueCounterValue} from '@root/util/id/unique-counter';
import {EMPTY_LOGGER} from '@root/util/logging/empty';
import {testTrivialBooleanCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';
import {
  createChatMemberChange,
  createLeftChatMemberMessage,
  createNewChatMemberMessage,
} from '../test-data/updates';

describe('/deleteEntryOnKick', () => {
  const botTest = setupTest();
  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    await testTrivialBooleanCommandChangingDatabase({
      botTest,
      command: '/deleteEntryOnKick',
      property: 'deleteEntryOnKick',
      replyFalseKey: T_`deleteEntryOnKick_false`,
      replyTrueKey: T_`deleteEntryOnKick_true`,
    });
  });

  it('should delete entry/leave messages', async () => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMessages,
      popMessageDeletes,
      popMemberKicks,
      unixSeconds,
      user,
      groupChat,
    } = await botTest.init();

    await findChatById(appContext, groupChat.id);

    await Promise.all([
      appContext.database.setChatProperty({
        chatId: groupChat.id,
        property: 'captchaType',
        value: CaptchaType.SIMPLE,
      }),
      appContext.database.setChatProperty({
        chatId: groupChat.id,
        property: 'deleteEntryOnKick',
        value: true,
      }),
      appContext.database.setChatProperty({
        chatId: groupChat.id,
        property: 'timeGiven',
        value: 0,
      }),
    ]);

    await handleUpdate(
      createChatMemberChange({
        user,
        chat: groupChat,
        unixSeconds,
        fromStatus: 'left',
        toStatus: 'member',
      }),
    );

    const newChatMemberMessageId = getUniqueCounterValue();

    await handleUpdate(
      createNewChatMemberMessage({
        user,
        chat: groupChat,
        messageId: newChatMemberMessageId,
        unixSeconds,
      }),
    );

    await onIdle();

    const captchaMessageId = (() => {
      const messages = popMessages();
      expect(messages.length).toBe(1);

      const [{messageId}] = messages;

      return messageId;
    })();

    await checkUsersToKick({appContext, logger: EMPTY_LOGGER});

    {
      const deletes = popMessageDeletes();
      expect(deletes.length).toBe(2);

      expect(deletes[0]).toStrictEqual({
        chatId: groupChat.id,
        messageId: newChatMemberMessageId,
      });
      expect(deletes[1]).toStrictEqual({
        chatId: groupChat.id,
        messageId: captchaMessageId,
      });
    }

    {
      const kicks = popMemberKicks();
      expect(kicks).toStrictEqual([{chatId: groupChat.id, userId: user.id}]);
    }

    const leftChatMemberMessageId = getUniqueCounterValue();

    await handleUpdate(
      createLeftChatMemberMessage({
        user,
        chat: groupChat,
        messageId: leftChatMemberMessageId,
        unixSeconds,
      }),
    );

    await onIdle();

    {
      const deletes = popMessageDeletes();
      expect(deletes).toStrictEqual([
        {
          chatId: groupChat.id,
          messageId: leftChatMemberMessageId,
        },
      ]);
    }
  });
});
