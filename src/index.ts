import 'module-alias/register';
import {isMaster} from 'cluster';
import {run as runMaster} from './cluster-master';
import {run as runWorker} from './cluster-worker';
import {createContext} from './context';

const appContext = createContext();

// in-memory database can work only with single worker and intended for dev-purposes only,
// and also SIGINT handling works bad under `concurrently`, looks like we should resend
// this signal from master to workers and vise-versa (or maybe investigate
// `concurrently` options to send SIGNINT for all child processes
if (appContext.config.database === 'memory') {
  process.on('SIGINT', () => {
    appContext.stop().then(
      () => {
        process.exit(0);
      },
      (error) => {
        appContext.logger.error('sigint', undefined, {error});
        process.exit(1);
      },
    );
  });
}

appContext.run(() => {
  if (isMaster) {
    appContext.isWorker = false;
    runMaster(appContext);
  } else {
    runWorker(appContext);
  }
});
