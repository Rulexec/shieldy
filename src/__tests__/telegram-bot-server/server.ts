import {getUniqueCounterValue} from '@root/util/id/unique-counter';
import {readWholeStream} from '@root/util/stream/read-whole-stream';
import {Server, createServer, IncomingMessage, ServerResponse} from 'http';
import {TEST_BOT_USERNAME} from '../constants';
import {Chat, getUser, User} from '../test-data/chats';
import {InlineKeyboardKey, Message, MessageEdit} from '../test-data/types';
import {createMessage} from '../test-data/updates';

type UserStatusType =
  | 'creator'
  | 'administrator'
  | 'member'
  | 'restricted'
  | 'left'
  | 'kicked';

export type TelegramBotServerOptions = {
  token: string;
  botId: number;
  getUserById: (id: number) => {
    user: User;
    status: UserStatusType;
  } | null;
  getChatById: (id: number) => Chat;
  getChatAdministrators: (
    id: number,
  ) => {user: User; status: UserStatusType; can_restrict_members: boolean}[];
  getCurrentTime: () => number;
};

export type MessageDelete = {
  chatId: number;
  messageId: number;
};

export type KickMember = {
  chatId: number;
  userId: number;
};

export class TelegramBotServer {
  private server: Server;
  private token: string;
  private botId: number;
  private messages: Message[] = [];
  private messageEdits: MessageEdit[] = [];
  private messageDeletes: MessageDelete[] = [];
  private memberKicks: KickMember[] = [];
  private getUserById: TelegramBotServerOptions['getUserById'];
  private getChatById: (id: number) => Chat;
  private getChatAdministrators: TelegramBotServerOptions['getChatAdministrators'];
  private getCurrentTime: () => number;

  constructor({
    token,
    botId,
    getUserById,
    getChatById,
    getChatAdministrators,
    getCurrentTime,
  }: TelegramBotServerOptions) {
    this.token = token;
    this.botId = botId;
    this.getUserById = getUserById;
    this.getChatById = getChatById;
    this.getChatAdministrators = getChatAdministrators;
    this.getCurrentTime = getCurrentTime;
    this.server = createServer((req, res) => {
      this.handleRequest(req, res).catch((error) => {
        console.error(error);
      });
    });
  }

  handleRequest = async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> => {
    if (!req.url) {
      res.statusCode = 500;
      res.end('500');
      return;
    }

    const match = /^\/bot([^/]+)\/([a-zA-Z]+)$/.exec(req.url);
    if (!match) {
      res.statusCode = 400;
      res.end('notParsed');
      return;
    }

    const [, token, cmd] = match;

    if (token !== this.token) {
      res.statusCode = 403;
      res.end('403');
      return;
    }

    switch (cmd) {
      case 'getMe':
        res.end(
          JSON.stringify({
            ok: true,
            result: {
              id: this.botId,
              is_bot: true,
              first_name: 'test bot',
              username: TEST_BOT_USERNAME,
              can_join_groups: true,
              can_read_all_group_messages: false,
              supports_inline_queries: false,
            },
          }),
        );
        return;
      case 'sendMessage': {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());

        const inlineKeyboardData = data.reply_markup?.inline_keyboard;
        const inlineKeyboard: InlineKeyboardKey[] = [];

        const traverse = (arrayOrKey: any) => {
          if (Array.isArray(arrayOrKey)) {
            arrayOrKey.forEach((data) => {
              traverse(data);
            });
          } else if (arrayOrKey) {
            inlineKeyboard.push({
              text: arrayOrKey.text,
              callbackData: arrayOrKey.callback_data,
            });
          }
        };
        traverse(inlineKeyboardData);

        const messageId = getUniqueCounterValue();
        const unixSeconds = Math.floor(this.getCurrentTime() / 1000);

        this.messages.push({
          chatId: data.chat_id,
          messageId,
          text: data.text,
          replyToMessageId: data.reply_to_message_id,
          inlineKeyboard: inlineKeyboard.length ? inlineKeyboard : undefined,
          unixSeconds,
          isSilent: Boolean(data.disable_notification),
        });

        const chat = this.getChatById(data.chat_id);

        const message = createMessage({
          messageId: messageId,
          user: getUser(this.botId, {isBot: true}),
          chat,
          unixSeconds,
          text: data.text,
        }).message;

        res.end(JSON.stringify({ok: true, result: message}));
        return;
      }
      case 'getChatMember': {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());
        const {user_id: userId} = data;

        // TODO: support unexistance of users
        const userData = this.getUserById(userId) || {
          user: {
            id: userId,
            is_bot: false,
            first_name: `First${userId}`,
            last_name: `Last${userId}`,
            username: `nick${userId}`,
            language_code: 'en',
          },
          status: 'member',
        };

        res.end(
          JSON.stringify({
            ok: true,
            result: {
              user: userData.user,
              status: userData.status,
              is_anonymous: false,
            },
          }),
        );
        return;
      }
      case 'getChatAdministrators': {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());
        const {chat_id: chatId} = data;

        res.end(
          JSON.stringify({
            ok: true,
            result: this.getChatAdministrators(chatId),
          }),
        );
        return;
      }
      case 'editMessageText': {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());

        this.messageEdits.push({
          chatId: data.chat_id,
          messageId: data.message_id,
          text: data.text,
        });

        res.end(JSON.stringify({ok: true}));
        return;
      }
      case 'deleteMessage': {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());

        this.messageDeletes.push({
          chatId: data.chat_id,
          messageId: data.message_id,
        });

        res.end(JSON.stringify({ok: true}));
        return;
      }
      case 'getChat': {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());

        const {chat_id} = data;

        const chat = this.getChatById(chat_id);
        const {id, type} = chat;

        res.end(
          JSON.stringify({
            ok: true,
            result: {
              id,
              type,
              title: 'Chat title',
              permissions: {
                can_send_messages: true,
                can_send_media_messages: true,
                can_send_polls: true,
                can_send_other_messages: true,
                can_add_web_page_previews: true,
                can_change_info: true,
                can_invite_users: true,
                can_pin_messages: true,
              },
            },
          }),
        );
        return;
      }
      case 'kickChatMember': {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());

        this.memberKicks.push({chatId: data.chat_id, userId: data.user_id});

        res.end(JSON.stringify({ok: true}));
        break;
      }
      default: {
        const buffer = await readWholeStream(req);
        const data = JSON.parse(buffer.toString());

        console.error(req.method, req.url, JSON.stringify(data, null, '\t'));
        res.statusCode = 500;
        res.end('500');
      }
    }
  };

  init = async (): Promise<void> => {
    await new Promise<void>((resolve) => {
      this.server.listen(0, () => {
        resolve();
      });
    });
  };

  popMessages = (): Message[] => {
    const messages = this.messages;
    this.messages = [];
    return messages;
  };

  popMessageEdits = (): MessageEdit[] => {
    const edits = this.messageEdits;
    this.messageEdits = [];
    return edits;
  };

  popMessageDeletes = (): MessageDelete[] => {
    const deletes = this.messageDeletes;
    this.messageDeletes = [];
    return deletes;
  };

  popMemberKicks = (): KickMember[] => {
    const kicks = this.memberKicks;
    this.memberKicks = [];
    return kicks;
  };

  destroy = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };

  getPort = (): number => {
    const address = this.server.address();
    if (!address || typeof address === 'string') {
      return 0;
    }

    return address.port;
  };
}
