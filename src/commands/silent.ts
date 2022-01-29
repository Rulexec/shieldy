import {Extra} from 'telegraf';
import {assertNonNullish} from '@root/util/assert/assert-non-nullish';
import {T_} from '@root/i18n/l10n-key';
import {commandHandler} from './util';

export const silentCommand = commandHandler(async (ctx) => {
  const {
    dbchat: chat,
    message,
    translate,
    appContext: {database, idling},
  } = ctx;
  assertNonNullish(message);

  const isSilent = !chat.silentMessages;
  chat.silentMessages = isSilent;

  await database.setChatProperty({
    chatId: chat.id,
    property: 'silentMessages',
    value: isSilent,
  });

  idling.wrapTask(() =>
    ctx.replyWithMarkdown(
      translate(isSilent ? T_`silentMessages_true` : T_`silentMessages_false`),
      Extra.inReplyTo(message.message_id).notifications(!isSilent),
    ),
  );
});
