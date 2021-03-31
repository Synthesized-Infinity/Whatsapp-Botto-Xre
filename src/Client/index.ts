import { MessageType, WAConnection, WAContact, WAGroupMetadata, WAMessage } from '@adiwajshing/baileys/'
import { Model } from 'mongoose'
import { IGroup, IGroupModel, IUserModel } from '../Mongo/Models'
import responses from '../lib/responses.json'
export default class Client extends WAConnection {
    private config: config

    constructor(public GroupModel: Model<IGroupModel>, public UserModel: Model<IUserModel>, configPath?: string) {
        super()
        this.config = configPath
            ? require(configPath)
            : {
                  name: 'XRE',
                  prefix: '!',
                  admins: ['']
              }
        this.emit('config', this.config)
    }
    async reply(jid: string, options: Reply, quote?: WAMessage): Promise<unknown> {
        return await this.sendMessage(jid, options.body, options.type || MessageType.text, {
            quoted: quote,
            caption: options.caption
        })
    }

    get _config(): config {
        return this.config
    }

    async getUser(jid: string): Promise<{ user: WAContact; data: IUserModel }> {
        let data = await this.UserModel.findOne({ jid })
        if (!data) data = await new this.UserModel({ jid }).save()
        return { user: this.contacts[jid], data }
    }

    async banUser(jid: string, ban: boolean): Promise<boolean> {
        let data = await this.UserModel.findOne({ jid })
        if (!data) data = await new this.UserModel({ jid }).save()
        if ((ban && data.ban) || (!ban && !data.ban)) return false
        await this.UserModel.updateOne({ jid }, { $set: { ban } })
        return true
    }

    async getGroupInfo(jid: string): Promise<Groupinfo> {
        const metadata = await this.groupMetadata(jid)
        const admins: string[] = []
        metadata.participants.forEach((user) => (user.isAdmin ? admins.push(user.jid) : ''))
        let data = await this.GroupModel.findOne({ jid })
        if (!data) data = await new this.GroupModel({ jid }).save()
        return { metadata, admins, data }
    }

    async getPfp(jid: string): Promise<string | null> {
        try {
            return await this.getProfilePicture(jid)
        } catch (err) {
            return null
        }
    }

    async banAction(chat: string, users: string[], ban: boolean, M: WAMessage): Promise<void> {
        for (const user of users) {
            const { notify, vname, name } = this.contacts[user]
            const username = notify || vname || name || user.split('@')[0]
            if (!this.config.admins.includes(user)) {
                const response = (await this.banUser(user, ban))
                    ? ban
                        ? responses['banned-user']
                        : responses['unbanned-user']
                    : !ban
                    ? responses['already-unbanned']
                    : responses['already-banned']
                this.reply(chat, { body: response.replace('{U}', username) }, M)
            }
        }
    }
}
export interface Groupinfo {
    metadata: WAGroupMetadata
    admins: string[]
    data: IGroup
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
