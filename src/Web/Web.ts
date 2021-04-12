import express from 'express'
import { EventEmitter } from 'events'
import { Client } from '../Client'

export class Web extends EventEmitter {
    app: express.Express

    QR: null | Buffer = null

    constructor(public client: Client, public PORT: number) {
        super()
        this.app = express()
        this.app.listen(this.PORT, () => this.emit('web-open', this.PORT))
    }
}
