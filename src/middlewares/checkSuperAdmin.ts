import { config } from '../config'
import { Context } from 'telegraf'

export function checkSuperAdmin(ctx: Context, next) {
  if (ctx.from.id !== parseInt(config.telegramAdminId, 10)) {
    return
  }
  return next()
}
