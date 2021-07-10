import Telegraf from 'telegraf';
import {User} from 'telegraf/typings/telegram-types';
import {Context} from './context';

// FIXME: do not mutate not our objects
export type Bot = Telegraf<Context> & {
  botInfo?: User;
};
