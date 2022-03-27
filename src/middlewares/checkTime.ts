import {BotMiddlewareNextStrategy} from '@root/bot/types';
import {Context} from '@sesuritu/types/src/context';
import {getMessageText} from '@sesuritu/types/src/hacks/get-message-text';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';

export function checkTime(ctx: Context): BotMiddlewareNextStrategy {
  const currentDate = ctx.appContext.getCurrentDate();

  if (ctx.update.message?.date && getMessageText(ctx) === '/help') {
    ctx.appContext.logger.trace('Got to checkTime on help', {
      ms: currentDate.getTime() / 1000 - ctx.update.message?.date,
    });
  }

  const {message, callbackQuery} = ctx;

  switch (ctx.updateType) {
    case 'message': {
      assertNonNullish(message);

      if (currentDate.getTime() / 1000 - message.date < 5 * 60) {
        return BotMiddlewareNextStrategy.next;
      }
      break;
    }
    case 'callback_query': {
      assertNonNullish(callbackQuery);

      if (
        callbackQuery.message &&
        currentDate.getTime() / 1000 - callbackQuery.message.date < 5 * 60
      ) {
        return BotMiddlewareNextStrategy.next;
      }
      break;
    }
    default:
      return BotMiddlewareNextStrategy.next;
  }

  return BotMiddlewareNextStrategy.abort;
}
