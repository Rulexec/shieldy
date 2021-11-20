import 'module-alias/register';
import {isMaster} from 'cluster';
import {run as runMaster} from './cluster-master';
import {run as runWorker} from './cluster-worker';
import {createContext} from './context';

const appContext = createContext();

appContext.run(() => {
  if (isMaster) {
    runMaster(appContext);
  } else {
    runWorker(appContext);
  }
});
