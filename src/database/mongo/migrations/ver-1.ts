import 'module-alias/register';
import {getConfig} from '@root/config';
import {CappedKickedUser} from '@root/models/CappedKickedUser';
import {CappedMessage} from '@root/models/CappedMessage';
import {Chat} from '@root/models/Chat';
import {EntryMessage} from '@root/models/EntryMessage';
import {MessageToDelete} from '@root/models/MessageToDelete';
import {VerifiedUser} from '@root/models/VerifiedUser';
import {Collection, MongoClient} from 'mongodb';

const cleanups: (() => Promise<void>)[] = [];

const main = async () => {
  const {mongoUri} = getConfig();

  const client = new MongoClient(mongoUri);
  cleanups.push(() => client.close());

  await client.connect();
  const db = client.db();

  const chatCollection: Collection<Chat> = db.collection('chats');
  const cappedKickedUsersCollection: Collection<CappedKickedUser> =
    db.collection('cappedkickedusers');
  const entryMessagesCollection: Collection<EntryMessage> =
    db.collection('entrymessages');
  const verifiedUsersCollection: Collection<VerifiedUser> =
    db.collection('verifiedusers');
  const messagesToDeleteCollection: Collection<MessageToDelete> =
    db.collection('messagetodeletes');
  const cappedMessagesCollection: Collection<CappedMessage> =
    db.collection('cappedmessages');

  await validateChats(chatCollection);
  await validateUniqueIndex({
    name: 'cappedKicked',
    keys: ['chatId', 'userId'],
    collection: cappedKickedUsersCollection,
  });
  await validateUniqueIndex({
    name: 'entryMessages',
    keys: ['chat_id', 'from_id'],
    collection: entryMessagesCollection,
  });
  await validateUniqueIndex({
    name: 'verifiedUsers',
    keys: ['id'],
    collection: verifiedUsersCollection,
  });
  await validateUniqueIndex({
    name: 'messagesToDelete',
    keys: ['chat_id', 'message_id'],
    collection: messagesToDeleteCollection,
  });
  await validateUniqueIndex({
    name: 'cappedMessages',
    keys: ['chat_id', 'from_id', 'message_id'],
    collection: cappedMessagesCollection,
  });

  await client.close();
};

const validateChats = async (chatCollection: Collection<Chat>) => {
  const cursor = chatCollection.find();

  const chatIds = new Set();

  while (true) {
    const chat = await cursor.next();
    if (!chat) {
      break;
    }

    if (chatIds.has(chat.id)) {
      throw new Error('chats has non-unique id');
    }

    chatIds.add(chat.id);

    const candidateIds = new Set(chat.candidates.map((x) => x.id));
    if (candidateIds.size !== chat.candidates.length) {
      throw new Error('chats has non-unique candidate');
    }

    const restrictedIds = new Set(chat.restrictedUsers.map((x) => x.id));
    if (restrictedIds.size !== chat.restrictedUsers.length) {
      throw new Error('chats has non-unique restricted users');
    }
  }
};

const validateUniqueIndex = async ({
  name,
  keys,
  collection,
}: {
  name: string;
  keys: string[];
  collection: Collection<any>;
}) => {
  const cursor = collection.find();

  const compoundIds = new Map<string, any>();

  while (true) {
    const doc = await cursor.next();
    if (!doc) {
      break;
    }

    const id = keys.map((key) => doc[key]).join('_');
    const prevMongoId = compoundIds.get(id);

    if (prevMongoId) {
      await collection.deleteOne({_id: prevMongoId});
      console.log(`${name} has non-unique value: ${id}`);
    }

    compoundIds.set(id, doc._id);
  }
};

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(() => {
    cleanups.forEach((fun) => {
      fun().catch((error) => {
        console.error(error);
      });
    });
  });
