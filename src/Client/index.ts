import { MessageType, WAConnection, WAMessage } from '@adiwajshing/baileys/'

export default class Client extends WAConnection {

    private config: config 

    constructor(configPath?: string) {
        super()
        this.config = (configPath) ? require(configPath) : {
            name: 'XRE',
            prefix: '!',
            admins: this.user?.jid || ['']
        }
        this.emit('config', this.config)
    }

    async reply(jid: string, options: Reply, quote?: WAMessage) {
        return await this.sendMessage(jid, options.body, options.type || MessageType.text, { quoted: quote, caption: options.caption})
    }

    get _config() {
        return this.config
    }

    async getGroupInfo(jid: string) {
        const metadata = await this.groupMetadata(jid)
        const admins: string[] = []
        metadata.participants.forEach((user) => user.isAdmin ? admins.push(user.jid) : '')
        return { metadata, admins }
    }

}


export interface config {

    name: string
    prefix: string
    admins: string[]

}

export interface Reply {

    body: string | Buffer
    type?: MessageType
    caption?: string

}