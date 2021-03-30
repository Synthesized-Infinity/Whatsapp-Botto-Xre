import { MessageType, WAConnection, WAGroupMetadata, WAMessage } from '@adiwajshing/baileys/'
import { Model } from 'mongoose'

export default class Client extends WAConnection {

    private config: config 

    constructor(public GroupModel: Model<any>, configPath?: string) {
        super()
        this.config = (configPath) ? require(configPath) : {
            name: 'XRE',
            prefix: '!',
            admins: [
                ''
            ]
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
        let data: groupConfig = await this.GroupModel.findOne({ jid })
        if (!data) data = await new this.GroupModel({ jid }).save()
        return { metadata, admins, data }
    }

    async getPfp(jid: string) {
        try {
            return await this.getProfilePicture(jid)
        } catch(err) {
            return null
        }
    }

}
export interface Groupinfo {
    metadata: WAGroupMetadata
    admins: string[]
    data: groupConfig
}

export interface groupConfig {
    jid: string,
    events: boolean | null
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