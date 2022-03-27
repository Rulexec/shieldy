import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {testTrivialBooleanCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';

describe('/banUsers', () => {
  const botTest = setupTest();
  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    await testTrivialBooleanCommandChangingDatabase({
      botTest,
      command: '/banUsers',
      property: 'banUsers',
      replyFalseKey: T_`banUsers_false`,
      replyTrueKey: T_`banUsers_true`,
    });
  });
});
