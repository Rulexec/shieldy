import 'module-alias/register';
import {botDeleteMessageSafe} from '@helpers/deleteMessageSafe';
import {createContext} from './context';

const appContext = createContext({instanceId: 'deleter'});
const {report, logger} = appContext;

let checking = false;

appContext.run(() => {
  // Check candidates
  setInterval(() => {
    if (!checking) {
      check();
    }
  }, 5 * 1000);
});

async function check() {
  checking = true;
  try {
    const date = new Date();
    const messages =
      await appContext.database.findMessagesToDeleteWithDeleteAtLessThan(date);
    await Promise.all(
      messages.map((message) =>
        (async () => {
          try {
            await botDeleteMessageSafe(appContext, {
              chatId: message.chat_id,
              messageId: message.message_id,
            });
          } catch (error) {
            // Do nothing
            report(error, 'message delete');
          }
        })(),
      ),
    );
    await appContext.database.deleteMessagesToDeleteWithDeleteAtLessThan(date);
  } catch (err) {
    report(err, 'deleting messages');
  } finally {
    checking = false;
  }
}

logger.info('started');
