import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const underAttackCommand = commandHandler(async (ctx) => {
  ctx.dbchat.underAttack = !ctx.dbchat.underAttack;
  await ctx.appContext.database.setChatProperty({
    chatId: ctx.dbchat.id,
    property: 'underAttack',
    value: ctx.dbchat.underAttack,
  });

  assertNonNullish(ctx.message);

  ctx.replyWithMarkdown(
    ctx.translate(
      ctx.dbchat.underAttack ? T_`underAttack_true` : T_`underAttack_false`,
    ),
    Extra.inReplyTo(ctx.message.message_id).notifications(
      !ctx.dbchat.silentMessages,
    ),
  );
});
