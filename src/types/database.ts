import {CappedMessage} from '@root/models/CappedMessage';
import {Candidate, Chat, ChatId} from '@root/models/Chat';
import {EntryMessage} from '@root/models/EntryMessage';
import {MessageToDelete} from '@root/models/MessageToDelete';

export type AddChatRestrictedFn = (options: {
  chatId: number;
  candidates: Candidate[];
}) => Promise<void>;

export type RemoveChatRestrictedFn = (options: {
  chatId: number;
  candidateIds: number[];
}) => Promise<void>;

type ChatProperties = {
  [Key in keyof Chat]: {chatId: number; property: Key; value: Chat[Key]};
};
type Values<O> = O extends Record<string, infer K> ? K : never;
export type SetChatPropertyOptions = Values<ChatProperties>;

type FilteredKeys<T, U> = {[P in keyof T]: T[P] extends U ? P : never}[keyof T];
export type BooleanChatPropertyKey = NonNullable<FilteredKeys<Chat, boolean>>;

export type Database = {
  init: () => Promise<void>;
  stop?: () => Promise<void>;

  // TODO: change to `Chat | undefined`
  getChatById: (chatId: ChatId) => Promise<Chat | null>;
  updateChat: (chat: Chat) => Promise<void>;
  findChatsWithCandidatesOrRestrictedUsers: () => Promise<Chat[]>;
  setChatProperty: (options: SetChatPropertyOptions) => Promise<void>;
  addChatRestrictedUsers: AddChatRestrictedFn;
  removeChatRestrictedUsers: RemoveChatRestrictedFn;
  addChatCandidates: AddChatRestrictedFn;
  removeChatCandidates: RemoveChatRestrictedFn;
  modifyCandidateLeaveMessageId: (options: {
    chatId: number;
    candidateId: number;
    leaveMessageId: number;
  }) => Promise<void>;

  addKickedUser: (options: {chatId: number; userId: number}) => Promise<void>;
  isUserKicked: (options: {chatId: number; userId: number}) => Promise<boolean>;

  addEntryMessage: (message: EntryMessage) => Promise<void>;
  findEntryMessages: (query: Partial<EntryMessage>) => Promise<EntryMessage[]>;
  deleteEntryMessage: (message: EntryMessage) => Promise<void>;

  addVerifiedUserId: (id: number) => Promise<void>;
  removeVerifiedUserId: (id: number) => Promise<void>;
  isUserIdVerified: (id: number) => Promise<boolean>;

  addMessageToDelete: (message: MessageToDelete) => Promise<void>;
  findMessagesToDeleteWithDeleteAtLessThan: (
    date: Date,
  ) => Promise<MessageToDelete[]>;
  deleteMessagesToDeleteWithDeleteAtLessThan: (date: Date) => Promise<void>;

  addCappedMessage: (message: CappedMessage) => Promise<void>;
  findCappedMessage: (
    query: Partial<CappedMessage>,
  ) => Promise<CappedMessage | undefined>;
  findCappedMessages: (
    query: Partial<CappedMessage>,
  ) => Promise<CappedMessage[]>;
};
