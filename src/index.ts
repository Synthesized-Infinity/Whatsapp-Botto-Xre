import { start } from './Main'
import path from 'path'

const config = path.join(__dirname, '..', 'config.json')
const PORT = Number(process.env.PORT) || 4001

start(PORT, config) 