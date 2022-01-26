import {T_} from '@root/i18n/l10n-key';
import {getNoTranslationText} from '@root/i18n/no-translation';
import {testCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';

describe('/buttonText', () => {
  const botTest = setupTest();
  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    await testCommandChangingDatabase({
      botTest,
      command: ({numberOfCalls}) =>
        `/buttonText${numberOfCalls % 2 ? ' test test' : ''}`,
      initialProperties: ({testInitData: {groupChat}}) => [
        {
          chatId: groupChat.id,
          property: 'buttonText',
          value: undefined,
        },
      ],
      validate: async ({
        testInitData: {
          groupChat,
          appContext: {database},
        },
        numberOfCalls,
      }) =>
        (await database.getChatById(groupChat.id))?.buttonText ===
        (numberOfCalls % 2 ? 'test test' : undefined),
      getReplyText: () => getNoTranslationText(T_`trust_success`),
    });
  });
});
