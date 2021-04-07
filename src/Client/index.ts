import { MessageType, WAConnection, WAContact, WAMessage } from '@adiwajshing/baileys/'
import { Model } from 'mongoose'
import responses from '../lib/responses.json'
import { schedule, validate } from 'node-cron'
import chalk from 'chalk'
import moment from 'moment-timezone'
import { IReply, IConfig, IGroupinfo, IGroupModel, IUserModel } from '../Typings'
export default class Client extends WAConnection {
    private config: IConfig

    constructor(public GroupModel: Model<IGroupModel>, public UserModel: Model<IUserModel>, configPath?: string) {
        super()
        this.config = configPath
            ? require(configPath)
            : {
                  name: 'XRE',
                  prefix: '!',
                  admins: [],
                  adminGroupId: '',
                  corn: null
              }
        if (this.config.cron) this.clearCycle(this.config.cron)
        if (this.config.adminGroupId)
            this.getGroupInfo(this.config.adminGroupId).then((info) =>
                info.admins.map((admin) => void this.config.admins.push(admin))
            )
        this.emit('config', this.config)
    }
    async reply(jid: string, options: IReply, quote?: WAMessage): Promise<unknown> {
        return await this.sendMessage(jid, options.body, options.type || MessageType.text, {
            quoted: quote,
            caption: options.caption
        })
    }

    get _config(): IConfig {
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

    async getGroupInfo(jid: string): Promise<IGroupinfo> {
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

    clearCycle = async (time: string): Promise<void> => {
        if (!validate(time))
            return console.log(
                chalk.redBright('[CRON]'),
                chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
                chalk.red('Invalid Cron String', time)
            )
        console.log(
            chalk.blueBright('[CRON]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.yellow('Cron Job for Clearing all chas has been scheduled for'),
            chalk.greenBright(time)
        )
        schedule(time, async () => {
            console.log(
                chalk.blueBright('[CRON]'),
                chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
                chalk.yellow('Clearing All Chats...')
            )
            await this.clearAllChats()
            console.log(
                chalk.blueBright('[CRON]'),
                chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
                chalk.yellow('Cleared All Chats')
            )
        })
    }

    clearAllChats = async (): Promise<{ status: 200 | 500 }> => {
        const chats = this.chats.all()
        this.setMaxListeners(25)
        try {
            for (const chat of chats) {
                await this.modifyChat(chat.jid, 'clear')
            }
            return { status: 200 }
        } catch (err) {
            return { status: 500 }
        }
    }
}
