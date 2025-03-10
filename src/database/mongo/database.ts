import {Collection, Db, MongoClient} from 'mongodb';

import {AppContext} from '@root/types/app-context';
import {
  AddChatRestrictedFn,
  Database,
  RemoveChatRestrictedFn,
} from '@root/types/database';
import {Chat} from '@root/models/Chat';
import {CappedKickedUser} from '@root/models/CappedKickedUser';
import {EntryMessage} from '@root/models/EntryMessage';
import {assertTypesEqual} from '@root/types/type-assert';
import {pickNonUndefined} from '@root/util/object/pick-non-undefined';
import {VerifiedUser} from '@root/models/VerifiedUser';
import {MessageToDelete} from '@root/models/MessageToDelete';
import {CappedMessage} from '@root/models/CappedMessage';
import {normalizeChat} from '@root/helpers/normalize-chat';

type RawChat = {readonly rawChatTag: unique symbol};

// TODO: replace upserts with inserts, handle unique index errors

// `assertTypesEqual` used to ensure,
// that we are not adding new object keys to mongodb accidentally

// WARN: do not use mongodb `.toArray()` without assignment to a variable,
//       it can do implicit casts due to generic in method

export class MongoDatabase implements Database {
  appContext: AppContext;
  client: MongoClient;
  db: Db;
  chatCollection: Collection<RawChat>;
  cappedKickedUsersCollection: Collection<CappedKickedUser>;
  entryMessagesCollection: Collection<EntryMessage>;
  verifiedUsersCollection: Collection<VerifiedUser>;
  messagesToDeleteCollection: Collection<MessageToDelete>;
  cappedMessagesCollection: Collection<CappedMessage>;

  constructor({appContext}: {appContext: AppContext}) {
    const {
      config: {mongoUri},
    } = appContext;

    this.appContext = appContext;
    this.client = new MongoClient(mongoUri);
  }

  async init(): Promise<void> {
    const {client} = this;

    await client.connect();

    const db = client.db();
    this.db = db;

    this.chatCollection = db.collection('chats');
    this.cappedKickedUsersCollection = db.collection('cappedkickedusers');
    this.entryMessagesCollection = db.collection('entrymessages');
    this.verifiedUsersCollection = db.collection('verifiedusers');
    this.messagesToDeleteCollection = db.collection('messagetodeletes');
    this.cappedMessagesCollection = db.collection('cappedmessages');

    const {
      chatCollection,
      cappedKickedUsersCollection,
      entryMessagesCollection,
      verifiedUsersCollection,
      messagesToDeleteCollection,
      cappedMessagesCollection,
    } = this;

    await chatCollection.createIndex(['id'], {unique: true});
    await chatCollection.createIndex(['id', 'candidates.id'], {unique: true});
    await chatCollection.createIndex(['id', 'restrictedUsers.id'], {
      unique: true,
    });

    await cappedKickedUsersCollection.createIndex(['chatId', 'userId'], {
      unique: true,
    });

    await entryMessagesCollection.createIndex(['chat_id', 'from_id'], {
      unique: true,
    });

    await verifiedUsersCollection.createIndex(['id'], {unique: true});

    await messagesToDeleteCollection.createIndex(['chat_id', 'message_id'], {
      unique: true,
    });
    await messagesToDeleteCollection.createIndex(['deleteAt']);

    await cappedMessagesCollection.createIndex(
      ['chat_id', 'from_id', 'message_id'],
      {unique: true},
    );
  }

  getChatById = async (chatId: number): Promise<Chat | null> => {
    const {chatCollection} = this;

    const rawChat = await chatCollection.findOne({id: chatId});
    if (!rawChat) {
      return null;
    }

    return this.normalizeChat(rawChat);
  };

  updateChat = async (chat: Chat): Promise<void> => {
    const {chatCollection} = this;

    await chatCollection.updateOne({id: chat.id}, {$set: chat}, {upsert: true});
  };

  findChatsWithCandidatesOrRestrictedUsers = async (): Promise<Chat[]> => {
    const chats = await this.chatCollection
      .find({
        $or: [{candidates: {$gt: []}}, {restrictedUsers: {$gt: []}}],
      })
      .toArray();

    return Promise.all(chats.map((chat) => this.normalizeChat(chat)));
  };

  setChatProperty: Database['setChatProperty'] = async ({
    chatId,
    property,
    value,
  }) => {
    await this.chatCollection.updateOne(
      {id: chatId},
      {$set: {[property]: value}},
    );
  };

  addChatRestrictedUsers: AddChatRestrictedFn = async ({
    chatId,
    candidates,
  }) => {
    const candidatesWithTimestamp = candidates.map((candidate) => {
      if (typeof candidate.timestamp === 'number') {
        return candidate;
      }

      return {
        ...candidate,
        timestamp: this.appContext.getCurrentDate().getTime(),
      };
    });

    await this.chatCollection.updateOne(
      {id: chatId},
      {
        $push: {
          restrictedUsers: {$each: candidatesWithTimestamp},
        },
      },
    );
  };

  removeChatRestrictedUsers: RemoveChatRestrictedFn = async ({
    chatId,
    candidateIds,
  }) => {
    await this.chatCollection.updateOne(
      {id: chatId},
      {
        $pull: {restrictedUsers: {id: {$in: candidateIds}}},
      },
    );
  };

  addChatCandidates: AddChatRestrictedFn = async ({chatId, candidates}) => {
    await this.chatCollection.updateOne(
      {id: chatId},
      {
        $push: {
          candidates: {$each: candidates},
        },
      },
    );
  };

  removeChatCandidates: RemoveChatRestrictedFn = async ({
    chatId,
    candidateIds,
  }) => {
    await this.chatCollection.updateOne(
      {id: chatId},
      {
        $pull: {candidates: {id: {$in: candidateIds}}},
      },
    );
  };

  modifyCandidateLeaveMessageId: Database['modifyCandidateLeaveMessageId'] =
    async ({chatId, candidateId, leaveMessageId}) => {
      await this.chatCollection.updateOne(
        {'id': chatId, 'candidates.id': candidateId},
        {$set: {'candidates.$.leaveMessageId': leaveMessageId}},
      );
    };

  addKickedUser: Database['addKickedUser'] = async ({chatId, userId}) => {
    await this.cappedKickedUsersCollection.updateOne(
      {chatId, userId},
      {$set: {chatId, userId}},
      {upsert: true},
    );
  };

  isUserKicked: Database['isUserKicked'] = async ({chatId, userId}) => {
    return Boolean(
      await this.cappedKickedUsersCollection.findOne({chatId, userId}),
    );
  };

  addEntryMessage: Database['addEntryMessage'] = async ({
    chat_id,
    message_id,
    from_id,
    ...rest
  }) => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    assertTypesEqual<{}, typeof rest>(true);

    const index = {chat_id, from_id};
    const msg = {...index, message_id};

    await this.entryMessagesCollection.updateOne(
      index,
      {$set: msg},
      {upsert: true},
    );
  };

  findEntryMessages: Database['findEntryMessages'] = async (rawQuery) => {
    const query: Record<string, unknown> = pickNonUndefined(rawQuery);
    if (!query.chat_id || !query.from_id) {
      throw new Error('findEntryMessages indexed only by chat_id,from_id');
    }

    const messages = await this.entryMessagesCollection.find(query).toArray();
    return messages;
  };

  deleteEntryMessage: Database['deleteEntryMessage'] = async (message) => {
    await this.entryMessagesCollection.deleteOne(message);
  };

  addVerifiedUserId: Database['addVerifiedUserId'] = async (id: number) => {
    await this.verifiedUsersCollection.updateOne(
      {id},
      {$set: {id}},
      {upsert: true},
    );
  };

  removeVerifiedUserId: Database['removeVerifiedUserId'] = async (
    id: number,
  ) => {
    await this.verifiedUsersCollection.deleteOne({id});
  };

  isUserIdVerified: Database['isUserIdVerified'] = async (id: number) => {
    return Boolean(await this.verifiedUsersCollection.findOne({id}));
  };

  addMessageToDelete: Database['addMessageToDelete'] = async ({
    chat_id,
    message_id,
    deleteAt,
    ...rest
  }: MessageToDelete) => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    assertTypesEqual<{}, typeof rest>(true);

    await this.messagesToDeleteCollection.updateOne(
      {chat_id, message_id},
      {
        $set: {chat_id, message_id, deleteAt},
      },
      {upsert: true},
    );
  };

  findMessagesToDeleteWithDeleteAtLessThan: Database['findMessagesToDeleteWithDeleteAtLessThan'] =
    async (date: Date) => {
      // TODO: add limit
      const messages = await this.messagesToDeleteCollection
        .find({deleteAt: {$lt: date}})
        .toArray();
      return messages;
    };

  deleteMessagesToDeleteWithDeleteAtLessThan: Database['deleteMessagesToDeleteWithDeleteAtLessThan'] =
    async (date: Date) => {
      await this.messagesToDeleteCollection.deleteMany({
        deleteAt: {$lt: date},
      });
    };

  addCappedMessage: Database['addCappedMessage'] = async ({
    chat_id,
    from_id,
    message_id,
    createdAt,
    ...rest
  }: CappedMessage) => {
    // eslint-disable-next-line @typescript-eslint/ban-types
    assertTypesEqual<{}, typeof rest>(true);

    const index = {chat_id, from_id, message_id};
    const message = {...index, createdAt};

    await this.cappedMessagesCollection.updateOne(
      index,
      {$set: message},
      {upsert: true},
    );
  };

  findCappedMessage: Database['findCappedMessage'] = async (rawQuery) => {
    const query: Record<string, unknown> = pickNonUndefined(rawQuery);
    if (!query.chat_id || !query.from_id) {
      throw new Error('findCappedMessage indexed only by chat_id,from_id');
    }

    return await this.cappedMessagesCollection.findOne(query);
  };

  findCappedMessages: Database['findCappedMessages'] = async (rawQuery) => {
    const query: Record<string, unknown> = pickNonUndefined(rawQuery);
    if (!query.chat_id || !query.from_id) {
      throw new Error('findCappedMessages indexed only by chat_id,from_id');
    }

    const messages = await this.cappedMessagesCollection.find(query).toArray();
    return messages;
  };

  private normalizeChat = async (chat: RawChat): Promise<Chat> => {
    const newChat = normalizeChat(chat);
    if ((chat as unknown) !== newChat) {
      await this.updateChat(newChat);
    }

    return newChat;
  };
}
