import { start } from './Main'
import { config } from 'dotenv'
import { validate } from './Client'
config()
validate()
const PORT = Number(process.env.PORT) || 4001
const MONGO_URI = String(process.env.MONGO_URI) || 'mongodb://localhost/localdb'
start(PORT, MONGO_URI)
