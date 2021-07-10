export type User = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
};

export type Chat =
  | {
      type: 'private';
      id: number;
      first_name: string;
      last_name: string;
      username: string;
    }
  | {type: 'supergroup'; id: number; title: string};

export const getUser = (
  id: number,
  {isBot = false, username}: {isBot?: boolean; username?: string} = {},
): User => {
  return {
    id,
    is_bot: isBot,
    first_name: `First${id}`,
    last_name: `Last${id}`,
    username: username || `nick${id}`,
    language_code: 'en',
  };
};

export const getPrivateChat = ({
  id,
  first_name,
  last_name,
  username,
}: User): Chat => {
  return {
    id,
    first_name,
    last_name,
    username,
    type: 'private',
  };
};

export const getGroupChat = (id: number): Chat => {
  return {
    id,
    title: `Chat ${id}`,
    type: 'supergroup',
  };
};
