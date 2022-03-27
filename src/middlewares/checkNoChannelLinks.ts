import {isGroup} from '@helpers/isGroup';
import {deleteMessageSafe} from '@helpers/deleteMessageSafe';
import tall from 'tall';
import {Context} from '@sesuritu/types/src/context';
import {getMessageText} from '@sesuritu/types/src/hacks/get-message-text';
import {getChatUsername} from '@sesuritu/types/src/hacks/get-chat-username';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {BotMiddlewareNextStrategy} from '@root/bot/types';

const disallowedUrlParts = ['http://t.me/', 'https://t.me/'];

export async function checkNoChannelLinks(
  ctx: Context,
): Promise<BotMiddlewareNextStrategy> {
  if (ctx.update.message?.date && getMessageText(ctx) === '/help') {
    ctx.appContext.logger.trace('Got to checkNoChannelLinks on help', {
      ms:
        ctx.appContext.getCurrentDate().getTime() / 1000 -
        ctx.update.message?.date,
    });
  }
  // Get the message
  const message = ctx.editedMessage || ctx.message;
  // If there is no message, just continue
  if (!message) {
    return BotMiddlewareNextStrategy.next;
  }
  // If there is no need to check for links, just continue
  if (!ctx.dbchat.noChannelLinks) {
    return BotMiddlewareNextStrategy.next;
  }
  // If sent from private chat or channel, just continue
  if (!isGroup(ctx)) {
    return BotMiddlewareNextStrategy.next;
  }
  // If there are no url entities, just continue
  const allEntities = (message.entities || []).concat(
    message.caption_entities || [],
  );
  if (
    !allEntities.length ||
    !allEntities.reduce(
      (p, c) => c.type === 'url' || c.type === 'text_link' || p,
      false,
    )
  ) {
    return BotMiddlewareNextStrategy.next;
  }

  assertNonNullish(ctx.from);

  // If sent from admins, just ignore
  const adminIds = [ctx.appContext.config.telegramAdminId];
  if (adminIds.includes(ctx.from.id) || ctx.isAdministrator) {
    return BotMiddlewareNextStrategy.next;
  }
  // Create a placeholder if the message needs deletion
  let needsToBeDeleted = false;
  // Check all entities
  for await (const entity of allEntities) {
    // Skip unnecessary entities
    if (entity.type !== 'url' && entity.type !== 'text_link') {
      continue;
    }
    // Get url
    let url: string;
    if (entity.type == 'text_link' && entity.url) {
      url = entity.url;
    } else {
      const text = message.text || message.caption;
      assertNonNullish(text);

      url = text.substring(entity.offset, entity.offset + entity.length);
    }
    // If the link is a telegram link, mark the message for deletion
    if (checkIfUrlIncludesDisallowedParts(url, getChatUsername(ctx))) {
      needsToBeDeleted = true;
      break;
    }
    // Try to unshorten the link
    try {
      // Add http just in case
      url =
        url.includes('https://') || url.includes('http://')
          ? url
          : 'http://' + url;
      // Unshorten the url
      const unshortenedUrl = await tall(url);
      // If the link is a telegram link, mark the message for deletion
      if (
        checkIfUrlIncludesDisallowedParts(unshortenedUrl, getChatUsername(ctx))
      ) {
        needsToBeDeleted = true;
        break;
      }
    } catch (err) {
      // Do nothing
    }
  }
  // If one of the links in the message is a telegram link, delete the message
  if (needsToBeDeleted) {
    deleteMessageSafe(ctx);
    return BotMiddlewareNextStrategy.abort;
  }
  // Or just continue
  return BotMiddlewareNextStrategy.next;
}

function checkIfUrlIncludesDisallowedParts(url: string, chatUsername?: string) {
  for (const part of disallowedUrlParts) {
    if (
      url.includes(part) &&
      (!chatUsername || !url.includes(`://t.me/${chatUsername}`))
    ) {
      return true;
    }
  }
  return false;
}
