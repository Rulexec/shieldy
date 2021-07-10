import {User} from 'telegraf/typings/telegram-types';
import {Chat} from '@models/Chat';
import {AppContext} from '@root/types/app-context';

export async function botRestrictChatMember(
  appContext: AppContext,
  chat: Chat,
  user: User,
): Promise<void> {
  try {
    const gotUser = await appContext.telegrafBot.telegram.getChatMember(
      chat.id,
      user.id,
    );
    if (
      gotUser.can_send_messages &&
      gotUser.can_send_media_messages &&
      gotUser.can_send_other_messages &&
      gotUser.can_add_web_page_previews
    ) {
      const tomorrow = (new Date().getTime() + 24 * 60 * 60 * 1000) / 1000;
      await appContext.telegrafBot.telegram.restrictChatMember(
        chat.id,
        user.id,
        {
          until_date: tomorrow,
          permissions: {
            can_send_messages: true,
            can_send_media_messages: false,
            can_send_polls: false,
            can_send_other_messages: false,
            can_add_web_page_previews: false,
            can_change_info: false,
            can_invite_users: false,
            can_pin_messages: false,
          },
        },
      );
    }
  } catch (err) {
    appContext.report(err);
  }
}
