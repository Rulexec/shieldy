import { config } from '../config'
import { Context, Telegraf } from 'telegraf'
const TelegrafBot = require('telegraf')

export const bot = new TelegrafBot(config.telegramToken, {
  handlerTimeout: 1,
}) as Telegraf<Context>
