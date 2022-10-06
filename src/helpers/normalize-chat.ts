import {Chat, CustomCaptchaVariant} from '@root/models/Chat';

// FIXME: validate other fields
// should be called when chat was readed from the database
export const normalizeChat = (rawChat: unknown): Chat => {
  const chat = rawChat as Chat;
  let newChat = chat as Chat;
  const chatNeedsUpdate = () => {
    if (chat === newChat) {
      newChat = {...chat};
    }
  };

  const {customCaptchaVariants} = chat;

  const newVariants = normalizeChatVariants(customCaptchaVariants);

  if (newVariants !== customCaptchaVariants) {
    chatNeedsUpdate();
    newChat.customCaptchaVariants = newVariants;
  }

  return newChat;
};

const normalizeChatVariants = (
  variants: CustomCaptchaVariant[] | undefined,
): CustomCaptchaVariant[] => {
  if (!variants) {
    return [];
  }

  const hasIds = variants.every(({id}) => typeof id === 'number');
  if (hasIds) {
    return variants;
  }

  return variants.map((variant, index) => ({...variant, id: index + 1}));
};
