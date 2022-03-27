import {Context} from '@sesuritu/types/src/context';
import {isGloballyRestricted} from '@helpers/globallyRestricted';
import {deleteMessageSafe} from '@helpers/deleteMessageSafe';
import {MessageEntity} from 'typegram';
import {getMessageText} from '@sesuritu/types/src/hacks/get-message-text';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

export function checkRestrict(ctx: Context): BotMiddlewareNextStrategy {
  if (ctx.update.message?.date && getMessageText(ctx) === '/help') {
    ctx.appContext.logger.trace('Got to checkRestrict on help', {
      ms:
        ctx.appContext.getCurrentDate().getTime() / 1000 -
        ctx.update.message?.date,
    });
  }
  // Get the message
  const message = ctx.editedMessage || ctx.message;
  // Continue if there is no message
  if (!message) {
    return BotMiddlewareNextStrategy.next;
  }
  // Continue if the restrict is off
  if (!ctx.dbchat.restrict) {
    return BotMiddlewareNextStrategy.next;
  }

  assertNonNullish(ctx.from);

  // Don't restrict super admin
  if (ctx.from.id === ctx.appContext.config.telegramAdminId) {
    return BotMiddlewareNextStrategy.next;
  }
  // Just delete the message if globally restricted
  if (isGloballyRestricted(ctx.from.id)) {
    deleteMessageSafe(ctx);
    return BotMiddlewareNextStrategy.abort;
  }
  // Check if this user is restricted
  const restricted = ctx.dbchat.restrictedUsers
    .map((u) => u.id)
    .includes(ctx.from.id);
  // If a restricted user tries to send restricted type, just delete it
  if (
    restricted &&
    ((message.entities &&
      message.entities.length &&
      entitiesContainMedia(message.entities)) ||
      (message.caption_entities &&
        message.caption_entities.length &&
        entitiesContainMedia(message.caption_entities)) ||
      message.forward_from ||
      message.forward_date ||
      message.forward_from_chat ||
      message.document ||
      message.sticker ||
      message.photo ||
      message.video_note ||
      message.video ||
      message.game)
  ) {
    deleteMessageSafe(ctx);
    return BotMiddlewareNextStrategy.abort;
  }
  // Or just continue
  return BotMiddlewareNextStrategy.next;
}

const allowedEntities = [
  'hashtag',
  'cashtag',
  'bold',
  'italic',
  'underline',
  'strikethrough',
];
function entitiesContainMedia(entities: MessageEntity[]) {
  for (const entity of entities) {
    if (!allowedEntities.includes(entity.type)) {
      return true;
    }
  }
  return false;
}
