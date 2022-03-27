import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {testTrivialBooleanCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';

describe('/cas', () => {
  const botTest = setupTest();
  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    await testTrivialBooleanCommandChangingDatabase({
      botTest,
      command: '/cas',
      property: 'cas',
      replyFalseKey: T_`cas_false`,
      replyTrueKey: T_`cas_true`,
    });
  });
});
