import { Client } from './Client'
import chalk from 'chalk'
import mongoose from 'mongoose'
import qr from 'qr-image'
import moment from 'moment-timezone'
import { writeFileSync } from 'fs-extra'

import { Web, BaseRoutes } from './Web'
import { Message } from './Handler'
import { EventHandler as EvHandler } from './Handler'
import { schema } from './Mongo'

export const start = async (PORT: number, MONGO_URI: string): Promise<void> => {
    const client = new Client(schema.group, schema.user, schema.session)

    const db = mongoose.connection

    db.once('open', async () =>
        console.log(
            chalk.green('[SERVER]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.yellow('Connected to Database')
        )
    )

    await mongoose.connect(encodeURI(MONGO_URI), {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    })

    client.logger.level = 'fatal'
    const auth = await client.getSession(process.env.SESSION_ID || 'PROD')
    if (auth) client.loadAuthInfo(auth)

    const web = new Web(client, PORT)

    web.on('web-open', (PORT) =>
        console.log(
            chalk.green('[WEB]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.yellow(
                `Web Server Started on`,
                `http://localhost:${PORT}?session=${
                    process.env.SESSION_ID || 'PROD'
                } | http://localhost:${PORT}/endpoints?session=${process.env.SESSION_ID || 'PROD'}`
            )
        )
    )

    new BaseRoutes(client, web)
    const MessageHandler = new Message(client)
    const EventHandler = new EvHandler(client)
    //Events

    client.on('config', (config) => {
        console.log(
            chalk.green('[SERVER]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.yellow('Config Loaded')
        ),
            console.table(chalk.yellow(config))
    })

    client.on('qr', (QR) => {
        web.QR = qr.imageSync(QR)
        console.log(
            chalk.green('[SERVER]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.yellow('Scan the QR Code to Proceed You can also Authenticate at'),
            chalk.blueBright(`http://localhost:${web.PORT}/client/qr?session=${process.env.SESSION_ID || 'PROD'}`)
        )
    })

    client.on('open', () => {
        web.QR = null
        console.log(
            chalk.green('[SERVER]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.yellow('Up and Ready to Go!')
        )
        client.updateSession(process.env.SESSION_ID || 'PROD')
        writeFileSync(
            `./${process.env.SESSION_ID || 'PROD'}_session.json`,
            JSON.stringify(client.base64EncodedAuthInfo(), null, '\t')
        )
    })

    client.on('chat-update', (update) => {
        if (!update.messages) return
        const { messages } = update
        const all = messages.all()
        const validatedMessage = MessageHandler.validate(all[0])
        if (!validatedMessage) return
        if (validatedMessage.chat === 'group') return void MessageHandler.handleGroupMessage(all[0])
        return void MessageHandler.handleDirectMessage(all[0])
    })

    client.on('chats-received', (update) => {
        if (update.hasNewChats)
            console.log(
                chalk.green('[SERVER]'),
                chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
                chalk.yellow('Chats Received and Cached')
            )
    })

    client.on('contacts-received', () => {
        console.log(
            chalk.green('[SERVER]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.yellow('Contacts Received and Cached')
        )
    })

    client.on('group-participants-update', (event) => EventHandler.handle(event))

    await client.connect()
}
