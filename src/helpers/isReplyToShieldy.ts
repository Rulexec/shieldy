import {Context} from 'telegraf';
import {Bot} from '@sesuritu/types/src/bot';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';

type Options = {
  ctx: Context;
  bot: Bot;
};

export function isReplyToShieldy(options: Options): boolean {
  const {ctx, bot} = options;

  // Check if reply
  if (!ctx.message || !ctx.message.reply_to_message) {
    return false;
  }

  assertNonNullish(bot.botInfo);

  // Check if reply to shieldy
  if (
    !ctx.message.reply_to_message.from ||
    !ctx.message.reply_to_message.from.username ||
    ctx.message.reply_to_message.from.username !== bot.botInfo.username
  ) {
    return false;
  }

  return true;
}
