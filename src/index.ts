import { start } from './Main'
import path from 'path'
import { config as env } from 'dotenv'

env()
const config = path.join(__dirname, '..', 'config.json')
const PORT = Number(process.env.PORT) || 4001
const MONGO_URI = String(process.env.MONGO_URI) || 'mongodb://localhost/localdb'

start(config, PORT, MONGO_URI)
