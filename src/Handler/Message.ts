import { MessageType, proto, WAMessage } from '@adiwajshing/baileys'
import chalk from 'chalk'
import Client from '../Client'
import { help, GroupEx, toggleableGroupActions, getWById, wSearch } from '../lib'
import moment from 'moment-timezone'
import responses from '../lib/responses.json'
import Utils from '../Utils'
import { IParsedArgs } from '../Typings'
export class Message {
    validTypes = [MessageType.text, MessageType.image, MessageType.video, MessageType.extendedText]
    constructor(private client: Client, public group: GroupEx) {}

    handleGroupMessage = async (M: WAMessage): Promise<void> => {
        const from = M.key.remoteJid
        if (!from) return

        const { message } = M
        if (!message) return
        const { body, media } = this.getBase(M, message)
        if (!body) return
        const opt = this.parseArgs(body)
        if (!opt) return
        const { args, flags } = opt

        if (!args[0].startsWith(this.client._config.prefix)) return this.freeText(body, M)
        const command = args[0].slice(1).toLowerCase()

        if (!command) return void this.client.reply(from, { body: responses["no-command-after-prefix"].replace('{}', this.client._config.prefix)})
        const slicedJoinedArgs = args
            .join(' ')
            .slice(command.length + this.client._config.prefix.length)
            .trim()

        const barSplit = slicedJoinedArgs.includes('|') ? slicedJoinedArgs.split('|') : []

        const sender = M.participant
        const mentioned = message?.extendedTextMessage?.contextInfo?.mentionedJid
            ? message.extendedTextMessage.contextInfo?.mentionedJid
            : message?.extendedTextMessage?.contextInfo?.participant
            ? [message.extendedTextMessage.contextInfo.participant]
            : []

        const group = await this.client.getGroupInfo(from)

        const { user, data: userData } = await this.client.getUser(sender)

        const username = user?.notify || user?.vname || user?.name || ''
        const [admin, iAdmin] = [group.admins.includes(sender), group.admins.includes(this.client.user.jid)]
        const mod = this.client._config.admins.includes(sender)
        console.log(
            chalk.green('[EXEC]'),
            chalk.blue(moment(Number(M.messageTimestamp) * 1000).format('DD/MM HH:mm:ss')),
            chalk.blueBright(command),
            chalk.yellow('from'),
            chalk.white(username),
            chalk.yellow('in'),
            chalk.white(group.metadata.subject)
        )
        if (userData.ban) return void this.client.reply(from, { body: responses['banned'] }, M)

        switch (command) {
            default:
                this.client.reply(from, { body: responses['invalid-command'] }, M)
                break
            case 'everyone':
            case 'everyone-h':
                return void this.client.everyone(from, group.metadata, admin, command === 'everyone-h', M)
            case 'group':
                return void this.client.reply(from, await this.group.simplifiedGroupInfo(group), M)
            case 'eval':
                if (mod) return void eval(slicedJoinedArgs)
                break
            case 'join':
                return void this.client.reply(
                    from,
                    from === this.client._config.adminGroupId
                        ? await this.group.join(slicedJoinedArgs, mod, username)
                        : { body: responses['cannot-execute'] },
                    M
                )
            case 'ban':
            case 'unban':
                if (!mod || mentioned.length === 0) return
                return this.client.banAction(from, mentioned, command === 'ban', M)
                break
            case 'hi':
                this.client.reply(from, { body: `Hi! ${username}` }, M)
                break
            case 'promote':
            case 'demote':
            case 'remove':
                this.client.reply(from, await this.group.toggleEvent(from, mentioned || [], admin, iAdmin, command), M)
                break
            case 'help':
                this.client.reply(from, { body: help(this.client, slicedJoinedArgs.toLowerCase().trim()) }, M)
                break
            case 'sticker':
                const sticker = !media
                    ? { body: responses['wrong-format-media'] }
                    : await Utils.createSticker(
                          await this.client.downloadMediaMessage(media),
                          flags.includes('--strech'),
                          barSplit[1],
                          barSplit[2]
                      )
                this.client.reply(from, sticker, M)
                break
            case 'anime':
            case 'manga':
            case 'character':
                this.client.reply(from, await wSearch(slicedJoinedArgs, this.client._config.prefix, command), M)
                break
            case 'aid':
            case 'mid':
            case 'chid':
                this.client.reply(
                    from,
                    await getWById(
                        slicedJoinedArgs,
                        command === 'aid' ? 'anime' : command === 'mid' ? 'manga' : 'character'
                    ),
                    M
                )
                break
            case 'register':
            case 'unregister':
                return void this.client.reply(
                    from,
                    await this.group.register(
                        admin,
                        group.data,
                        command === 'register',
                        slicedJoinedArgs.toLowerCase().trim() as toggleableGroupActions
                    ),
                    M
                )
        }
    }

    handleDirectMessage = async (M: WAMessage): Promise<void> => {
        const from = M.key.remoteJid
        if (!from) return

        const { message } = M
        if (!message) return
        const { body } = this.getBase(M, message)
        if (!body) return
        const opt = this.parseArgs(body)
        if (!opt) return
        const { args } = opt

        const { user } = await this.client.getUser(from)
        const username = user?.notify || user?.vname || user?.name || ''
        const cmd = args[0].startsWith(this.client._config.prefix)
        console.log(
            chalk.green(!cmd ? '[CHAT]' : '[EXEC]'),
            chalk.blue(moment(Number(M.messageTimestamp) * 1000).format('DD/MM HH:mm:ss')),
            chalk.blueBright(args[0], `[${args.length}]`),
            chalk.yellow('from'),
            chalk.white(username)
        )

        if (!cmd)
            return process.env.EIF
                ? void this.client.reply(
                      from,
                      {
                          body: (
                              await Utils.fetch(
                                  `${process.env.EIF}/${encodeURI(
                                      `chatbot?message=${body}&bot=${this.client._config.name}&user=${from}`
                                  )}`,
                                  {}
                              )
                          ).message
                      },
                      M
                  )
                : void null

        const command = args[0].slice(1).toLowerCase()

        const mod = this.client._config.admins.includes(from)
        if (!command) return

        switch (command) {
            default:
                return void this.client.reply(from, { body: responses['direct-message-cmd'] }, M)
            case 'join':
                return void this.client.reply(from, await this.group.join(body, mod, username))
            case 'eval':
                if (mod) return void eval(args.slice(1).join(' ').trim())
                break
        }
    }

    validate = (M: WAMessage): { type: MessageType; chat: 'group' | 'dm' } | false => {
        if (!M.message) return false
        if (!!M.key.fromMe) return false
        if (M.key.remoteJid?.endsWith('broadcast')) return false
        const type = Object.keys(M.message)[0]
        if (!this.validTypes.includes(type as MessageType)) return false
        return { type: type as MessageType, chat: M.key.remoteJid?.endsWith('g.us') ? 'group' : 'dm' }
    }

    getBase = (M: WAMessage, message: proto.IMessage): { body: string | null | undefined; media: WAMessage | null } => {
        const body = message?.conversation
            ? message.conversation
            : message?.extendedTextMessage
            ? message.extendedTextMessage.text
            : message?.imageMessage
            ? message.imageMessage.caption
            : message?.videoMessage
            ? message.videoMessage.caption
            : null

        const media =
            message?.imageMessage || message?.videoMessage
                ? M
                : message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
                  message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage
                ? JSON.parse(JSON.stringify(M).replace('quotedM', 'm')).message.extendedTextMessage.contextInfo
                : null

        return { body, media }
    }

    parseArgs = (text: string): false | IParsedArgs => {
        const [args, flags]: string[][] = [[], []]
        if (!text) return false
        const baseArgs = text.split(' ')
        baseArgs.forEach((arg) => {
            if (arg?.startsWith('--')) flags.push(arg)
            args.push(arg)
        })
        return { args, flags }
    }

    freeText = async (text: string, M: WAMessage): Promise<void> => {
        const args = text.split(/ +/g)
        const from = M.key.remoteJid
        if (!from) return
        const user = this.client.contacts[M.participant]
        const username = user?.notify || user?.vname || user?.name || ''
        const group = await this.client.getGroupInfo(from)
        const admin = group.admins.includes(user.jid)

        let txt = args[0].toLowerCase()
        let [log, body] = [false, '']
        if (args.includes('@everyone') && admin)  {
            if (admin) void this.client.everyone(from, group.metadata, true, false, M)
            log = true
            txt = '@everyone'
        }
        switch (txt) {
            case 'hey':
                body = 'Hi there!'
                log = true
                break
            case 'test':
                body = 'Well...'
                log = true
                break
        }
        if (log) {
            console.log(
                chalk.white('[TEXT]'),
                chalk.blue(moment(Number(M.messageTimestamp) * 1000).format('DD/MM HH:mm:ss')),
                chalk.blueBright(text),
                chalk.yellow('from'),
                chalk.white(username),
                chalk.yellow('in'),
                chalk.white(group.metadata.subject)
            )
            if (body) this.client.reply(from, { body }, M)
        }
    }
}
