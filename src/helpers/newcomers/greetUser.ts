import {Message} from 'telegram-typings';
import {User} from 'telegraf/typings/telegram-types';
import {Extra} from 'telegraf';
import {Context} from '@root/types/context';
import {constructMessageWithEntities} from '@helpers/newcomers/constructMessageWithEntities';
import {getName, getUsername} from '@helpers/getUsername';
import {getChatTitle} from '@root/types/hacks/get-chat-title';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {BotMiddlewareFn, BotMiddlewareNextStrategy} from '@root/bot/types';

export async function doGreetUser(
  ctx: Context,
  maybeUser?: User,
): Promise<void> {
  // Get the user (it can be function if used as middleware in telegraf)
  const user = maybeUser || ctx.from;
  // Check if greeting is required
  if (!ctx.dbchat.greetsUsers || !ctx.dbchat.greetingMessage) {
    return;
  }

  assertNonNullish(user);

  // Get marked up message
  const message = constructMessageWithEntities(
    ctx.dbchat.greetingMessage.message,
    user,
    {
      $title: await getChatTitle(ctx),
      $username: getUsername(user),
      $fullname: getName(user),
    },
  );
  // Add the @username of the greeted user at the end of the message if no $username was provided
  const originalMessageText = ctx.dbchat.greetingMessage.message.text;
  if (
    !originalMessageText.includes('$username') &&
    !originalMessageText.includes('$fullname')
  ) {
    const username = getUsername(user);
    const initialLength = `${message.text}\n\n`.length;
    message.text = `${message.text}\n\n${username}`;
    if (!message.entities) {
      message.entities = [];
    }
    message.entities.push({
      type: 'text_mention',
      offset: initialLength,
      length: username.length,
      user,
    });
  }

  const {greetingButtons} = ctx.dbchat;

  // Send the message
  let messageSent: Message;
  try {
    // TODO: investigate
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    message.chat = undefined;
    messageSent = await ctx.telegram.sendCopy(ctx.dbchat.id, message, {
      ...(greetingButtons
        ? Extra.webPreview(false).markup((m) =>
            m.inlineKeyboard(
              greetingButtons
                .split('\n')
                .map((s) => {
                  const components = s.split(' - ');
                  return m.urlButton(components[0], components[1]);
                })
                .map((v) => [v]),
            ),
          )
        : Extra.webPreview(false)),
      entities: message.entities,
    });
  } catch (err) {
    message.entities = [];
    // TODO: investigate
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    message.chat = undefined;
    messageSent = await ctx.telegram.sendCopy(ctx.dbchat.id, message, {
      ...(greetingButtons
        ? Extra.webPreview(false).markup((m) =>
            m.inlineKeyboard(
              greetingButtons
                .split('\n')
                .map((s) => {
                  const components = s.split(' - ');
                  return m.urlButton(components[0], components[1]);
                })
                .map((v) => [v]),
            ),
          )
        : Extra.webPreview(false)),
      entities: message.entities,
    });
  }

  // Delete greeting message if requested
  if (ctx.dbchat.deleteGreetingTime && messageSent) {
    const deleteTime = new Date();
    deleteTime.setSeconds(
      deleteTime.getSeconds() + ctx.dbchat.deleteGreetingTime,
    );
    ctx.appContext.database
      .addMessageToDelete({
        chat_id: messageSent.chat.id,
        message_id: messageSent.message_id,
        deleteAt: deleteTime,
      })
      .catch(ctx.appContext.report);
  }
}

export const greetUserMiddleware: BotMiddlewareFn = async (ctx) => {
  await doGreetUser(ctx);
  return BotMiddlewareNextStrategy.abort;
};
