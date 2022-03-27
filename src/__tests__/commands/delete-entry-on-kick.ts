import {T_} from '@sesuritu/types/src/i18n/l10n-key';
import {testTrivialBooleanCommandChangingDatabase} from '../helpers/command';
import {setupTest} from '../helpers/setup';

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
});
