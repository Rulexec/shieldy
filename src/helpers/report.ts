import {checkIfErrorDismissable} from '@helpers/error';
import {AppContext} from '@root/types/app-context';

let errorsToReport: string[] = [];

async function bulkReport(appContext: AppContext) {
  const {
    telegrafBot: bot,
    config: {telegramAdminId: adminChatId},
    logger,
  } = appContext;

  const tempErrorsToReport = errorsToReport;
  errorsToReport = [];

  if (!adminChatId) {
    return;
  }

  if (tempErrorsToReport.length > 20) {
    const reportText = tempErrorsToReport.reduce(
      (prev, cur) => `${prev}${cur}\n`,
      '',
    );
    const chunks = reportText.match(/[\s\S]{1,4000}/g);
    if (chunks) {
      for (const chunk of chunks) {
        try {
          await bot.telegram.sendMessage(adminChatId, chunk);
        } catch (error) {
          logger.error('bulkReport', undefined, {error});
        }
      }
    }
  }
}

export function initReporter(appContext: AppContext): {
  onShutdown: () => Promise<void>;
} {
  const logger = appContext.logger.fork('report');

  const intervalId = setInterval(bulkReport.bind(null, appContext), 60 * 1000);

  appContext.report = (error, reason) => {
    if (checkIfErrorDismissable(error)) {
      return;
    }
    logger.error('report', {reason}, {error});
    errorsToReport.push(`${reason ? `${reason}\n` : ''}${error.message}`);
  };

  return {
    // TODO: make final report
    onShutdown: () => {
      clearInterval(intervalId);

      return Promise.resolve();
    },
  };
}
