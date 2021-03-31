import Client from './Client'
import path from 'path'
import chalk from 'chalk'
import mongoose from 'mongoose'
import { existsSync, writeFileSync } from 'fs-extra'
import qr from 'qr-image'

import { Web, BaseRoutes } from './Web'
import { Message } from './Handler'
import { GroupEx } from './lib'
import { EventHandler as EvHandler } from './Handler'
import { schema } from './Mongo'

export const start = async (config: string, PORT: number, MONGO_URI: string): Promise<void> => {
    const client = new Client(schema.group, schema.user, config)

    const db = mongoose.connection

    client.logger.level = 'fatal'
    const session = path.join(__dirname, '..', 'session.json')
    const auth = existsSync(session) ? require(session) : null
    if (auth) client.loadAuthInfo(auth)

    const web = new Web(client, PORT)
    const Router = new BaseRoutes(client, web)
    Router.start()

    const GroupExtention = new GroupEx(client)
    const MessageHandler = new Message(client, GroupExtention)
    const EventHandler = new EvHandler(client)
    //Events

    db.once('open', async () => console.log(chalk.green('Connected to Database')))

    client.on('config', (config) => {
        console.log(chalk.green('[SERVER]', 'Config Loaded'))
        console.table(chalk.yellow(config))
    })

    client.on('qr', (QR) => {
        web.QR = qr.imageSync(QR)
        console.log(
            chalk.green('[SERVER]', 'Scan the QR Code to Proceed'),
            chalk.yellow('You can also Authenticate at'),
            chalk.green(`http://localhost:${web.PORT}/qr`)
        )
    })

    client.on('open', () => {
        web.QR = null
        console.log(chalk.green('[SERVER]'), chalk.yellow('Up and Ready to Go! 💚'))
        writeFileSync(session, JSON.stringify(client.base64EncodedAuthInfo(), null, '\t'))
    })

    client.on('chat-update', (update) => {
        if (!update.messages) return
        const { messages } = update
        const all = messages.all()
        if (!MessageHandler.validate(all[0])) return
        MessageHandler.handle(all[0])
    })

    client.on('group-participants-update', (event) => EventHandler.handle(event))

    mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    })

    await client.connect()

    web.on('web-open', (PORT) =>
        console.log(
            chalk.green('[WEB]'),
            chalk.yellow(`Web Server Started on`, `http://localhost:${PORT} | http://localhost:${PORT}/endpoints`)
        )
    )
}
