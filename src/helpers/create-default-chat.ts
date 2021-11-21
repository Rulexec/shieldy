import {CaptchaType, Chat, Language} from '@root/models/Chat';

export const createDefaultChat = (id: number): Chat => {
  return {
    id,
    language: Language.ENGLISH,
    captchaType: CaptchaType.DIGITS,
    timeGiven: 60,
    adminLocked: false,
    restrict: true,
    noChannelLinks: false,
    deleteEntryMessages: false,
    candidates: [],
    restrictedUsers: [],
    greetsUsers: false,
    customCaptchaMessage: false,
    customCaptchaVariants: [],
    strict: true,
    banUsers: false,
    deleteEntryOnKick: false,
    cas: true,
    underAttack: false,
    noAttack: false,
    allowInvitingBots: false,
    skipOldUsers: false,
    skipVerifiedUsers: false,
    banForFastRepliesToPosts: false,
    members: [],
    restrictTime: 24,
    banNewTelegramUsers: false,
    silentMessages: false,
  };
};
