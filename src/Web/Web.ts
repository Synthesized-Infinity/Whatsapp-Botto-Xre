import express from 'express'
import { EventEmitter } from 'events'
import Client from '../Client'

export class Web extends EventEmitter {

    app: express.Express

    constructor(public client: Client, PORT: number) {
        super()
        this.app = express()
        this.app.listen(PORT, () => this.emit('web-open', PORT))
    }
} 