import {AppContext} from '@sesuritu/types/src/app-context';
import {
  AddChatRestrictedFn,
  Database,
  RemoveChatRestrictedFn,
} from '@sesuritu/types/src/database';
import {Chat, ChatId} from '@sesuritu/types/src/models/Chat';
import {EntryMessage} from '@sesuritu/types/src/models/EntryMessage';
import {assertTypesEqual} from '@sesuritu/types/src/type-assert';
import {pickNonUndefined} from '@sesuritu/util/src/object/pick-non-undefined';
import {MessageToDelete} from '@sesuritu/types/src/models/MessageToDelete';
import {CappedMessage} from '@sesuritu/types/src/models/CappedMessage';
import {UserId} from '@sesuritu/types/src/models/user';
import {sleep} from '@sesuritu/util/src/async/sleep';
import {assertNonNullish} from '@sesuritu/util/src/assert/assert-non-nullish';
import {
  getOrCreateMap,
  getOrCreateSet,
} from '@sesuritu/util/src/map/get-or-create';
import {MessageId} from '@sesuritu/types/src/models/message';

/**
 * In-memory mock of MongoDatabase, used in tests.
 * Should behave as close as possible to MongoDatabase.
 */
export class MemoryDatabase implements Database {
  appContext: AppContext;

  chats: Map<ChatId, Chat> = new Map();
  cappedKickedUsers: Map<ChatId, Set<UserId>> = new Map();
  entryMessages: Map<ChatId, Map<UserId, Set<MessageId>>> = new Map();
  verifiedUsers: Set<UserId> = new Set();
  messagesToDelete: Map<ChatId, MessageToDelete[]> = new Map();
  cappedMessages: Map<ChatId, Map<UserId, CappedMessage[]>> = new Map();

  constructor({appContext}: {appContext: AppContext}) {
    this.appContext = appContext;
  }

  init = async (): Promise<void> => {
    // There and later sleeps added to force introduce asynchronous
    // behavior like real db connector
    // If MemoryDatabase will be used for real, move those sleeps to a flag
    await sleep(1);
  };

  getChatById = async (chatId: ChatId): Promise<Chat | null> => {
    await sleep(1);

    const chat = this.chats.get(chatId);
    return chat || null;
  };

  updateChat = async (chat: Chat): Promise<void> => {
    await sleep(1);

    let existingChat = this.chats.get(chat.id);
    if (existingChat) {
      existingChat = {
        ...existingChat,
        ...chat,
      };
    } else {
      existingChat = chat;
    }

    this.chats.set(chat.id, chat);
  };

  findChatsWithCandidatesOrRestrictedUsers = async (): Promise<Chat[]> => {
    await sleep(1);

    const chatsWithCandidatesOrRestricted: Chat[] = [];

    this.chats.forEach((chat) => {
      if (chat.candidates.length || chat.restrictedUsers.length) {
        chatsWithCandidatesOrRestricted.push(chat);
      }
    });

    return chatsWithCandidatesOrRestricted;
  };

  setChatProperty: Database['setChatProperty'] = async ({
    chatId,
    property,
    value,
  }) => {
    await sleep(1);

    const chat = this.chats.get(chatId);
    assertNonNullish(chat);

    this.chats.set(chatId, {
      ...chat,
      [property]: value,
    });
  };

  addChatRestrictedUsers: AddChatRestrictedFn = makeAddRestrictedOrCandidates(
    this,
    'restrictedUsers',
  );

  removeChatRestrictedUsers: RemoveChatRestrictedFn =
    makeRemoveRestrictedOrCandidates(this, 'restrictedUsers');

  addChatCandidates: AddChatRestrictedFn = makeAddRestrictedOrCandidates(
    this,
    'candidates',
  );

  removeChatCandidates: RemoveChatRestrictedFn =
    makeRemoveRestrictedOrCandidates(this, 'candidates');

  modifyCandidateLeaveMessageId: Database['modifyCandidateLeaveMessageId'] =
    async ({chatId, candidateId, leaveMessageId}) => {
      await sleep(1);

      const chat = this.chats.get(chatId);
      assertNonNullish(chat);

      const candidates = chat.candidates.map((user) => {
        if (user.id !== candidateId) {
          return user;
        }

        return {
          ...user,
          leaveMessageId,
        };
      });

      this.chats.set(chatId, {
        ...chat,
        candidates,
      });
    };

  addKickedUser: Database['addKickedUser'] = async ({chatId, userId}) => {
    await sleep(1);

    const kickedUsersSet = getOrCreateSet(this.cappedKickedUsers, chatId);

    kickedUsersSet.add(userId);
  };

  isUserKicked: Database['isUserKicked'] = async ({chatId, userId}) => {
    await sleep(1);

    const kickedUsersSet = this.cappedKickedUsers.get(chatId);
    if (!kickedUsersSet) {
      return false;
    }

    return kickedUsersSet.has(userId);
  };

  addEntryMessage: Database['addEntryMessage'] = async ({
    chat_id,
    message_id,
    from_id,
    ...rest
  }) => {
    await sleep(1);

    // eslint-disable-next-line @typescript-eslint/ban-types
    assertTypesEqual<{}, typeof rest>(true);

    const entryMessagesByUser = getOrCreateMap(this.entryMessages, chat_id);
    const entryMessagesSet = getOrCreateSet(entryMessagesByUser, from_id);

    entryMessagesSet.add(message_id);
  };

  findEntryMessages: Database['findEntryMessages'] = async (rawQuery) => {
    await sleep(1);

    const query: Partial<EntryMessage> = pickNonUndefined(rawQuery);
    const {chat_id, from_id} = query;

    if (!chat_id || !from_id) {
      throw new Error('findEntryMessages indexed only by chat_id,from_id');
    }

    const entryMessagesByUser = this.entryMessages.get(chat_id);
    if (!entryMessagesByUser) {
      return [];
    }

    const entryMessagesSet = entryMessagesByUser.get(from_id);
    if (!entryMessagesSet) {
      return [];
    }

    const result: EntryMessage[] = Array.from(entryMessagesSet).map(
      (messageId) => ({
        message_id: messageId,
        from_id,
        chat_id,
      }),
    );

    return result;
  };

  deleteEntryMessage: Database['deleteEntryMessage'] = async (message) => {
    await sleep(1);

    const entryMessagesByUser = this.entryMessages.get(message.chat_id);
    if (!entryMessagesByUser) {
      return;
    }

    const entryMessagesSet = entryMessagesByUser.get(message.from_id);
    if (!entryMessagesSet) {
      return;
    }

    entryMessagesSet.delete(message.message_id);
  };

  addVerifiedUserId: Database['addVerifiedUserId'] = async (id: number) => {
    await sleep(1);

    this.verifiedUsers.add(id);
  };

  removeVerifiedUserId: Database['removeVerifiedUserId'] = async (
    id: number,
  ) => {
    await sleep(1);

    this.verifiedUsers.delete(id);
  };

  isUserIdVerified: Database['isUserIdVerified'] = async (id: number) => {
    await sleep(1);

    return this.verifiedUsers.has(id);
  };

  addMessageToDelete: Database['addMessageToDelete'] = async ({
    chat_id,
    message_id,
    deleteAt,
    ...rest
  }: MessageToDelete) => {
    await sleep(1);

    // eslint-disable-next-line @typescript-eslint/ban-types
    assertTypesEqual<{}, typeof rest>(true);

    const messagesToDelete = this.messagesToDelete.get(chat_id) || [];

    const alreadyPresent = Boolean(
      messagesToDelete.find((message) => message.message_id === message_id),
    );

    if (alreadyPresent) {
      this.appContext.logger.warning('addMessageToDelete:duplicate');
      return;
    }

    this.messagesToDelete.set(chat_id, [
      ...messagesToDelete,
      {chat_id, message_id, deleteAt},
    ]);
  };

  findMessagesToDeleteWithDeleteAtLessThan: Database['findMessagesToDeleteWithDeleteAtLessThan'] =
    async (date: Date) => {
      await sleep(1);

      // TODO: add index by date

      const messages: MessageToDelete[] = [];

      this.messagesToDelete.forEach((messagesInChat) => {
        messagesInChat.forEach((msg) => {
          if (msg.deleteAt < date) {
            messages.push(msg);
          }
        });
      });

      return messages;
    };

  deleteMessagesToDeleteWithDeleteAtLessThan: Database['deleteMessagesToDeleteWithDeleteAtLessThan'] =
    async (date: Date) => {
      await sleep(1);

      // TODO: add index by date

      this.messagesToDelete.forEach((messagesInChat, chatId) => {
        const newMessages = messagesInChat.filter((msg) => {
          return msg.deleteAt >= date;
        });

        if (newMessages.length === messagesInChat.length) {
          return;
        }

        this.messagesToDelete.set(chatId, newMessages);
      });
    };

  addCappedMessage: Database['addCappedMessage'] = async ({
    chat_id,
    from_id,
    message_id,
    createdAt,
    ...rest
  }: CappedMessage) => {
    await sleep(1);

    // eslint-disable-next-line @typescript-eslint/ban-types
    assertTypesEqual<{}, typeof rest>(true);

    const messagesByUser = getOrCreateMap(this.cappedMessages, chat_id);
    const messages = messagesByUser.get(from_id) || [];

    const alreadyPresent = Boolean(
      messages.find((message) => message.message_id === message_id),
    );

    if (alreadyPresent) {
      this.appContext.logger.warning('addCappedMessage:duplicate');
      return;
    }

    messagesByUser.set(from_id, [
      ...messages,
      {
        chat_id,
        from_id,
        message_id,
        createdAt,
      },
    ]);
  };

  findCappedMessage: Database['findCappedMessage'] = async (rawQuery) => {
    await sleep(1);

    const query: Partial<CappedMessage> = pickNonUndefined(rawQuery);
    const {chat_id, from_id, message_id} = query;

    if (!chat_id || !from_id) {
      throw new Error('findCappedMessage indexed only by chat_id,from_id');
    }

    const messagesByUser = this.cappedMessages.get(chat_id);
    if (!messagesByUser) {
      return null;
    }

    const messages = messagesByUser.get(from_id) || [];

    if (!message_id) {
      return messages[0];
    }

    return (
      messages.find((message) => message.message_id === message_id) || null
    );
  };

  findCappedMessages: Database['findCappedMessages'] = async (rawQuery) => {
    await sleep(1);

    const query: Partial<CappedMessage> = pickNonUndefined(rawQuery);
    const {chat_id, from_id, message_id} = query;

    if (!chat_id || !from_id) {
      throw new Error('findCappedMessages indexed only by chat_id,from_id');
    }

    const messagesByUser = this.cappedMessages.get(chat_id);
    if (!messagesByUser) {
      return [];
    }

    const messages = messagesByUser.get(from_id) || [];

    if (!message_id) {
      return messages;
    }

    return messages.filter((message) => message.message_id === message_id);
  };
}

const makeAddRestrictedOrCandidates = (
  db: MemoryDatabase,
  key: 'restrictedUsers' | 'candidates',
): AddChatRestrictedFn => {
  return async ({chatId, candidates}) => {
    await sleep(1);

    const chat = db.chats.get(chatId);
    assertNonNullish(chat);

    const originalUsers = chat[key];
    const usersSet = new Set(originalUsers.map((user) => user.id));
    const usersList = originalUsers.slice();

    candidates.forEach((user) => {
      if (usersSet.has(user.id)) {
        // Mongo will $push such items even with unique index, so just warn
        db.appContext.logger.warning('makeAddRestrictedOrCandidates:exists', {
          key,
        });
      }

      usersSet.add(user.id);
      usersList.push(user);
    });

    db.chats.set(chatId, {
      ...chat,
      [key]: usersList,
    });
  };
};

const makeRemoveRestrictedOrCandidates = (
  db: MemoryDatabase,
  key: 'restrictedUsers' | 'candidates',
): RemoveChatRestrictedFn => {
  return async ({chatId, candidateIds}) => {
    await sleep(1);

    const chat = db.chats.get(chatId);
    assertNonNullish(chat);

    const originalUsers = chat[key];
    const candidateIdsSet = new Set(candidateIds);

    const usersList = originalUsers.filter((user) => {
      return !candidateIdsSet.has(user.id);
    });

    db.chats.set(chatId, {
      ...chat,
      [key]: usersList,
    });
  };
};
