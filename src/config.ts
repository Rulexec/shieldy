import { cpus } from 'os'

let workersCount = parseInt(process.env.WORKERS_COUNT, 10)
if (!isFinite(workersCount)) {
  workersCount = cpus().length
}

export const config = {
  workersCount,
  telegramToken: process.env.TOKEN,
  telegramAdminId: parseInt(process.env.ADMIN, 10),
  mongoUri: process.env.MONGO,
}
