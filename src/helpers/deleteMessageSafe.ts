import {AppContext} from '@root/types/app-context';
import {Context} from '@root/types/context';

export async function deleteMessageSafe(ctx: Context): Promise<void> {
  try {
    await ctx.appContext.idling.wrapTask(() => ctx.deleteMessage());
  } catch (err) {
    ctx.appContext.report(err);
  }
}

export async function botDeleteMessageSafe(
  appContext: AppContext,
  options: {chatId: number; messageId: number},
): Promise<void> {
  const {chatId, messageId} = options;

  try {
    await appContext.idling.wrapTask(() =>
      appContext.telegrafBot.telegram.deleteMessage(chatId, messageId),
    );
  } catch (err) {
    appContext.report(err);
  }
}
