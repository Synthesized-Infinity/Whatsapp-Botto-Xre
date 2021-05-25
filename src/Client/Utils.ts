import { MessageType, WAConnection, WAGroupMetadata, WAMessage } from '@adiwajshing/baileys/'
import { Model } from 'mongoose'
import responses from '../lib/responses.json'
import { schedule, validate } from 'node-cron'
import chalk from 'chalk'
import moment from 'moment-timezone'
import { IReply, IConfig, IGroupModel, IUserModel, ISessionModel, ISession, IUserInfo } from '../Typings'
import { existsSync } from 'fs-extra'
import { join } from 'path'
import Utils from '../Utils'
const browser: [string, string, string] = ['WhatsApp-Botto-Xre', 'Well', 'Indeed']
export class Client extends WAConnection {
    assets = join(__dirname, '..', '..', 'assets')

    browserDescription = browser
    private config: IConfig = {
        name: process.env.BOT_NAME || 'Xre',
        prefix: process.env.PREFIX || '!',
        admins: this.getMods(),
        cron: process.env.CRON || null
    }

    constructor(
        public GroupModel: Model<IGroupModel>,
        public UserModel: Model<IUserModel>,
        public SessionModel: Model<ISessionModel>
    ) {
        super()
        if (this.config.cron) this.clearCycle(this.config.cron)
        if (process.env.ADMIN_GROUP_JID)
            this.groupMetadata(process.env.ADMIN_GROUP_JID).then((info) =>
                info.participants.filter((u) => u.isAdmin).map((admin) => void this.config.admins.push(admin.jid))
            )
        this.emit('config', this.config)
    }

    getMods(): string[] {
        if (!process.env.ADMINS) return []
        if (process.env.ADMINS.includes(','))
            return process.env.ADMINS.replace(/\+/g, '')
                .split(',')
                .map((num) => `${num}@s.whatsapp.net`)
        return [`${process.env.ADMINS}@s.whatsapp.net`]
    }

    async getSession(ID: string): Promise<ISession | false> {
        if (existsSync(`./${ID}_session.json`)) return require(join(__dirname, '..', '..', `./${ID}_session.json`))
        const session = await this.SessionModel.findOne({ ID })
        if (!session) return false
        return session.session
    }

    async updateSession(ID: string): Promise<void> {
        const session = await this.SessionModel.findOne({ ID })
        if (!session) return void (await new this.SessionModel({ ID, session: this.base64EncodedAuthInfo() }).save())
        return void (await this.SessionModel.updateOne({ ID }, { $set: { session: this.base64EncodedAuthInfo() } }))
    }

    async reply(jid: string, options: IReply, quote?: WAMessage): Promise<unknown> {
        return await this.sendMessage(jid, options.body, options.type || MessageType.text, {
            quoted: quote,
            caption: options.caption,
            mimetype: options.mime
        })
    }

    get _config(): IConfig {
        return this.config
    }

    async getUser(jid: string): Promise<IUserInfo> {
        let data: IUserModel | null = await this.UserModel.findOne({ jid })
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

    async everyone(
        jid: string,
        metadata: WAGroupMetadata,
        admin: boolean,
        hidden: boolean,
        M?: WAMessage
    ): Promise<void> {
        if (!admin) return void this.reply(jid, { body: responses['no-permission'] }, M)
        const mentionedJid = metadata.participants.map((participant) => participant.jid)
        const text = `🎀 *${metadata.subject}* 🎀\n${
            hidden
                ? `🗣 *[TAGS HIDDEN]* 🗣`
                : `${responses.spoilers.base}\n💮 ${mentionedJid
                      .map((participant) => `@${participant.split('@')[0]}`)
                      .join('\n💮 ')}`
        }`
        this.sendMessage(jid, text, MessageType.extendedText, { quoted: M, contextInfo: { mentionedJid } })
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
            chalk.yellow('Cron Job for Clearing all chats has been scheduled for'),
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

    getLinkPreview = async (link: string): Promise<Buffer> =>
        Buffer.from((await this.generateLinkPreview(link)).jpegThumbnail)

    deleteQuotedMessage = async (M: WAMessage): Promise<string> => {
        if (!M?.message?.extendedTextMessage?.contextInfo || !M.key.remoteJid) return responses['wrong-format']
        await this.deleteMessage(M.key.remoteJid, {
            id: M.message.extendedTextMessage.contextInfo.stanzaId,
            remoteJid: M.key.remoteJid,
            fromMe: true
        })
        return `Sucessfully Deleted Message`
    }

    getUserProfile = async (jid: string, userinfo: IUserInfo, admin = false): Promise<IReply> => {
        const caption = `🍁 *Username: ${
            userinfo.user.notify || userinfo.user.vname || userinfo.user.name || 'None'
        }*\n\n🍥 *About: ${(await this.getStatus(jid)).status || 'None'}*\n\n🎖️ *Admin: ${admin}*\n\n🎯 *Ban: ${
            userinfo.data.ban || false
        }*`
        return {
            body: await Utils.download(
                (await this.getPfp(jid)) || 'https://img.wallpapersafari.com/tablet/1536/2048/19/44/evOxST.jpg'
            ),
            caption,
            type: MessageType.image
        }
    }
}
