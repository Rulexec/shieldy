import {Message} from 'telegraf/typings/telegram-types';
import {ChatMember} from 'telegram-typings';

export enum Language {
  ENGLISH = 'en',
  RUSSIAN = 'ru',
  ITALIAN = 'it',
  ESTONIAN = 'et',
  UKRAINIAN = 'uk',
  PORTUGUESE = 'br',
  TURKISH = 'tr',
  SPANISH = 'es',
  CHINESE = 'zh',
  NORWEGIAN = 'no',
  GERMAN = 'de',
  TAIWAN = 'tw',
  FRENCH = 'fr',
  INDONESIAN = 'id',
  KOREAN = 'ko',
  AMHARIC = 'am',
  CZECH = 'cz',
  ARABIC = 'ar',
  JAPANESE = 'ja',
  ROMANIAN = 'ro',
  SLOVAK = 'sk',
  CATALAN = 'ca',
  CANTONESE = 'yue',
  BULGARIAN = 'bg',
}

export enum CaptchaType {
  SIMPLE = 'simple',
  DIGITS = 'digits',
  BUTTON = 'button',
  IMAGE = 'image',
  CUSTOM = 'custom',
}

export class Equation {
  question: string;
  answer: string;
}

export class Candidate {
  id: number;
  timestamp: number;
  captchaType: CaptchaType;
  messageId?: number;
  username?: string;
  restrictTime?: number;
  equationQuestion?: string;
  equationAnswer?: string;
  imageText?: string;
  customQuestion?: string;
  customAnswer?: string;
  entryMessageId?: number;
  leaveMessageId?: number;
  entryChatId?: number;
}

export class MessageWrapper {
  message: Message;
}

export class MemberWrapper {
  id: number;
  timestamp: number;
  member: ChatMember;
}

export class CustomCaptchaVariant {
  question: string;
  answer: string;
}

export enum ReplySettingType {
  ADD_CUSTOM_CAPTCHA = 'addCustomCaptcha',
  ADD_CUSTOM_CAPTCHA_ANSWER = 'addCustomCaptchaAnswer',
}

// Stores message id which should be replied to set some setting
export class ReplySetting {
  type: ReplySettingType;
  messageId: number;
  customCaptchaQuestion?: string;
}

export type ChatId = number;

export class Chat {
  id: ChatId;
  language: Language;
  captchaType: CaptchaType;
  timeGiven: number;
  adminLocked: boolean;
  restrict: boolean;
  noChannelLinks: boolean;
  deleteEntryMessages: boolean;
  candidates: Candidate[];
  restrictedUsers: Candidate[];
  greetsUsers: boolean;
  greetingMessage?: MessageWrapper;
  customCaptchaMessage: boolean;
  captchaMessage?: MessageWrapper;
  customCaptchaVariants: CustomCaptchaVariant[];
  strict: boolean;
  deleteGreetingTime?: number;
  banUsers: boolean;
  deleteEntryOnKick: boolean;
  cas: boolean;
  underAttack: boolean;
  noAttack: boolean;
  buttonText?: string;
  allowInvitingBots: boolean;
  greetingButtons?: string;
  skipOldUsers: boolean;
  skipVerifiedUsers: boolean;
  banForFastRepliesToPosts: boolean;
  members: MemberWrapper[];
  restrictTime: number;
  banNewTelegramUsers: boolean;
  lastReplySetting?: ReplySetting;
  silentMessages?: boolean;
}
