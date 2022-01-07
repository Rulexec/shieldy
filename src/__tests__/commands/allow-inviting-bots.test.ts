import {findChatById} from '@root/helpers/find-chat';
import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {setupTest} from '../helpers/setup';
import {createMessage, createNewChatMemberMessage} from '../test-data/updates';

describe('/allowInvitingBots', () => {
  const botTest = setupTest();

  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMessages,
      unixSeconds,
      user,
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
      createMessage({
        user,
        chat: groupChat,
        unixSeconds,
        text: '/allowInvitingBots',
        isBotCommand: true,
      }),
    );
    await onIdle();

    expect((await database.getChatById(groupChat.id))?.allowInvitingBots).toBe(
      true,
    );

    {
      const messages = popMessages();
      expect(messages.length).toBe(1);
      expect(messages[0].chatId).toBe(groupChat.id);
      expect(messages[0].text).toBe(
        getNoTranslationText(T_`allowInvitingBots_true`),
      );
    }

    await handleUpdate(
      createMessage({
        user,
        chat: groupChat,
        unixSeconds,
        text: '/allowInvitingBots',
        isBotCommand: true,
      }),
    );
    await onIdle();

    expect((await database.getChatById(groupChat.id))?.allowInvitingBots).toBe(
      false,
    );

    {
      const messages = popMessages();
      expect(messages.length).toBe(1);
      expect(messages[0].chatId).toBe(groupChat.id);
      expect(messages[0].text).toBe(
        getNoTranslationText(T_`allowInvitingBots_false`),
      );
    }
  });

  it('should kick bots', async () => {
    const {
      appContext,
      handleUpdate,
      onIdle,
      popMemberKicks,
      unixSeconds,
      otherBotUser,
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
  });
});
