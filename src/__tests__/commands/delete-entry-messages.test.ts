import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {testTrivialBooleanCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';

describe('/deleteEntryMessages', () => {
  const botTest = setupTest();
  afterEach(botTest.afterEach);

  it('should save flag to database', async () => {
    await testTrivialBooleanCommandChangingDatabase({
      botTest,
      command: '/deleteEntryMessages',
      property: 'deleteEntryMessages',
      replyFalseKey: T_`deleteEntryMessages_false`,
      replyTrueKey: T_`deleteEntryMessages_true`,
    });
  });
});
