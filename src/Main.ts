import Client from './Client'
import path from 'path'
import chalk from 'chalk'
import { existsSync, writeFileSync } from 'fs-extra'
import { Web, BaseRoutes } from './Web'
import { Message } from './Handler'
import { GroupEx } from './lib'

export const start = async (PORT: number, config: string) => {

    const client = new Client(config)
    
    client.logger.level = 'fatal'
    const session = path.join(__dirname, '..', 'session.json')
    const auth = (existsSync(session)) ? require(session) : null
    if (auth) client.loadAuthInfo(auth)





    //Events
    
    client.on('config', (config) => {
        console.log(chalk.green('[SERVER]', 'Config Loaded'))
        console.table(chalk.yellow(config))
    })

    client.on('qr', () => {
        console.log(chalk.green('[SERVER]', 'Scan the QR Code to Proceed', 'Learn More: https://faq.whatsapp.com/web/download-and-installation/how-to-log-in-or-out/'))
    })

    client.on('open', () => {
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

    await client.connect()

    const web = new Web(client, PORT)

    const GroupExtention = new GroupEx(client)
    const MessageHandler = new Message(client, GroupExtention)

    const Router = new BaseRoutes(client, web)


    web.on('web-open', (PORT) => console.log(chalk.green('[WEB]'), chalk.yellow(`Web Server Started on`, `http://localhost:${PORT} | http://localhost:${PORT}/endpoints`)))

    Router.start()

}