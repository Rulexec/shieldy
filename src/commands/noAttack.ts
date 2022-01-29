import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const noAttackCommand = commandHandler(async (ctx) => {
  ctx.dbchat.noAttack = !ctx.dbchat.noAttack;
  await ctx.appContext.database.setChatProperty({
    chatId: ctx.dbchat.id,
    property: 'noAttack',
    value: ctx.dbchat.noAttack,
  });

  assertNonNullish(ctx.message);

  ctx.replyWithMarkdown(
    ctx.translate(ctx.dbchat.noAttack ? T_`noAttack_true` : T_`noAttack_false`),
    Extra.inReplyTo(ctx.message.message_id).notifications(
      !ctx.dbchat.silentMessages,
    ),
  );
});
