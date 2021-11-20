import {Context} from '@root/types/context';

export async function clarifyReply(ctx: Context): Promise<void> {
  const {database, report} = ctx.appContext;
  const sent = await ctx.reply(ctx.translate('thisIsNotAReply'));
  const sent2 = await ctx.reply(ctx.translate('thisIsAReply'), {
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
