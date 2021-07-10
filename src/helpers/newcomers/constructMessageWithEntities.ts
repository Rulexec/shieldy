import {cloneDeep} from 'lodash';
import {Message} from 'telegraf/typings/telegram-types';
import {User} from 'telegram-typings';

export function constructMessageWithEntities(
  originalMessage: Message,
  user: User,
  tags: {[index: string]: string | undefined},
): Message {
  const message = cloneDeep(originalMessage);
  let originalText = message.text;
  for (const tag of Object.keys(tags)) {
    const tag_value = tags[tag];
    if (!tag_value) {
      continue;
    }
    while (originalText.includes(tag)) {
      const tag_offset = originalText.indexOf(tag);

      const tag_length = tag.length;
      const tag_value_length = tag_value.length;

      // Replace the tag with the value in the message
      originalText = originalText.replace(tag, tag_value);
      // Update the offset of links if it is after the replaced tag
      if (message.entities && message.entities.length) {
        message.entities.forEach((msgEntity) => {
          // Entities after
          if (msgEntity.offset > tag_offset + tag_length) {
            msgEntity.offset = msgEntity.offset - tag_length + tag_value_length;
          } else if (
            msgEntity.offset <= tag_offset &&
            msgEntity.offset + msgEntity.length >= tag_offset + tag_length
          ) {
            msgEntity.length += tag_value_length - tag_length;
          }
        });
      }
      if (tag === '$username' || tag === '$fullname') {
        if (!message.entities) {
          message.entities = [];
        }
        message.entities.push({
          type: 'text_mention',
          offset: tag_offset,
          length: tag_value_length,
          user,
        });
      }
    }
  }
  message.text = originalText;
  return message;
}
