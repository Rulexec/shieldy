import {Context} from '@sesuritu/types/src/context';
import {T_} from '@sesuritu/types/src/i18n/l10n-key';

export async function clarifyReply(ctx: Context): Promise<void> {
  const {database, report} = ctx.appContext;
  const sent = await ctx.reply(ctx.translate(T_`thisIsNotAReply`));
  const sent2 = await ctx.reply(ctx.translate(T_`thisIsAReply`), {
    reply_to_message_id: sent.message_id,
  });
  const deleteTime = new Date();
  deleteTime.setSeconds(deleteTime.getSeconds() + 30);
  database
    .addMessageToDelete({
      chat_id: sent.chat.id,
      message_id: sent.message_id,
      deleteAt: deleteTime,
    })
    .catch(report);
  database
    .addMessageToDelete({
      chat_id: sent2.chat.id,
      message_id: sent2.message_id,
      deleteAt: deleteTime,
    })
    .catch(report);
}
