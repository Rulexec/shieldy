import 'module-alias/register';
import {createContext} from './context';
import {checkUsersToKick} from './helpers/check-users-to-kick';

const appContext = createContext({instanceId: 'kicker'});
const {report, logger} = appContext;

let checking = false;

appContext.run(() => {
  // Check candidates
  setInterval(() => {
    logger.trace('checkCandidates', {checking});
    if (!checking) {
      check();
    }
  }, 15 * 1000);

  logger.info('started');
});

async function check() {
  checking = true;
  try {
    await checkUsersToKick({appContext, logger});
  } catch (err) {
    report(err, 'checking candidates');
  } finally {
    logger.trace('findCandidates:finish');
    checking = false;
  }
}
