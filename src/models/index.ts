import * as mongoose from 'mongoose'
import { setGlobalOptions, Severity } from '@typegoose/typegoose'
import { config } from '../config'

mongoose.connect(config.mongoUri, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

setGlobalOptions({
  options: {
    allowMixed: Severity.ALLOW,
  },
})
