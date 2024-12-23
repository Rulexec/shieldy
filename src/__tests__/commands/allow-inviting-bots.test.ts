import {findChatById} from '@root/helpers/find-chat';
import {T_} from '@root/i18n/l10n-key';
import {testTrivialBooleanCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';
import {createNewChatMemberMessage} from '../test-data/updates';

describe('/allowInvitingBots', () => {
  const botTest = setupTest();
  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    await testTrivialBooleanCommandChangingDatabase({
      botTest,
      command: '/allowInvitingBots',
      property: 'allowInvitingBots',
      replyFalseKey: T_`allowInvitingBots_false`,
      replyTrueKey: T_`allowInvitingBots_true`,
    });
  });

  it('should kick bots', async () => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMemberKicks,
      unixSeconds,
      otherBotUser,
      adminUser,
      groupChat,
    } = await botTest.init();

    const {database} = appContext;

    await findChatById(appContext, groupChat.id);
    await database.setChatProperty({
      chatId: groupChat.id,
      property: 'allowInvitingBots',
      value: false,
    });

    await handleUpdate(
      createNewChatMemberMessage({
        user: otherBotUser,
        chat: groupChat,
        unixSeconds,
      }),
    );
    await onIdle();

    expect(popMemberKicks()).toStrictEqual([
      {chatId: groupChat.id, userId: otherBotUser.id},
    ]);

    await database.setChatProperty({
      chatId: groupChat.id,
      property: 'allowInvitingBots',
      value: true,
    });

    await handleUpdate(
      createNewChatMemberMessage({
        user: otherBotUser,
        chat: groupChat,
        unixSeconds,
      }),
    );
    await onIdle();

    expect(popMemberKicks()).toStrictEqual([]);

    // Check case when admin adds bot
    await database.setChatProperty({
      chatId: groupChat.id,
      property: 'allowInvitingBots',
      value: false,
    });

    await handleUpdate(
      createNewChatMemberMessage({
        user: otherBotUser,
        fromUser: adminUser,
        chat: groupChat,
        unixSeconds,
      }),
    );
    await onIdle();

    expect(popMemberKicks()).toStrictEqual([]);
  });
});
