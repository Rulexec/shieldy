import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {testTrivialBooleanCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';

describe('/banNewTelegramUsers', () => {
  const botTest = setupTest();
  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    await testTrivialBooleanCommandChangingDatabase({
      botTest,
      command: '/banNewTelegramUsers',
      property: 'banNewTelegramUsers',
      replyFalseKey: T_`banNewTelegramUsers_false`,
      replyTrueKey: T_`banNewTelegramUsers_true`,
    });
  });
});
