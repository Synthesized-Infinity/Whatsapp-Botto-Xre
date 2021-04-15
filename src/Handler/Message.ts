import { MessageType, Mimetype, proto, WAGroupMetadata, WAMessage } from '@adiwajshing/baileys'
import chalk from 'chalk'
import { Client } from '../Client'
import { createSticker, help, toggleableGroupActions, getWById, wSearch, ytSreach, getYTMediaFromUrl } from '../lib'
import moment from 'moment-timezone'
import responses from '../lib/responses.json'
import Utils from '../Utils'
import { IParsedArgs } from '../Typings'
import { readFile } from 'fs-extra'
import { join } from 'path'
import { getRepoInfo, info } from '../lib/info'
export class Message {
    validTypes = [MessageType.text, MessageType.image, MessageType.video, MessageType.extendedText]
    constructor(private client: Client) {}

    handleGroupMessage = async (M: WAMessage): Promise<void> => {
        const from = M.key.remoteJid
        if (!from) return
        const { message } = M.message?.ephemeralMessage || M
        if (!message) return
        const sender = M.participant

        const mod = this.client._config.admins.includes(sender)
        const group = await this.client.getGroupInfo(from)
        const { user, data: userData } = await this.client.getUser(sender)
        const [admin, iAdmin] = [group.admins.includes(sender), group.admins.includes(this.client.user.jid)]
        const username = user?.notify || user?.vname || user?.name || ''
        if (group.data.safe && !admin && iAdmin && (await this.checkMessageForNSFWandAct(M, username, group.metadata)))
            return void null
        const { body, media } = this.getBase(M, message)
        if (!body) return
        const opt = this.parseArgs(body)
        if (!opt) return
        const { args, flags } = opt
        if (!args[0].startsWith(this.client._config.prefix)) return this.freeText(body, M)
        const command = args[0].slice(1).toLowerCase()
        if (!command)
            return void this.client.reply(
                from,
                { body: responses['no-command-after-prefix'].replace('{P}', this.client._config.prefix) },
                M
            )
        const slicedJoinedArgs = args
            .join(' ')
            .slice(command.length + this.client._config.prefix.length)
            .trim()

        const barSplit = slicedJoinedArgs.includes('|') ? slicedJoinedArgs.split('|') : []

        const mentioned = message?.extendedTextMessage?.contextInfo?.mentionedJid
            ? message.extendedTextMessage.contextInfo?.mentionedJid
            : message?.extendedTextMessage?.contextInfo?.participant
            ? [message.extendedTextMessage.contextInfo.participant]
            : []

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

        const ad = Math.floor(Math.random() * 5) + 1
        try {
            switch (command) {
                default:
                    this.client.reply(from, { body: responses['invalid-command'] }, M)
                    break
                case 'id':
                    return void this.client.reply(from, { body: `GID: ${from}` }, M)
                case 'everyone':
                    return void this.client.everyone(from, group.metadata, admin, flags.includes('--hide'), M)
                case 'group':
                    return void this.client.reply(from, await this.client.group.simplifiedGroupInfo(group), M)
                case 'eval':
                    if (mod) return void eval(slicedJoinedArgs)
                    break
                case 'join':
                    return void this.client.reply(
                        from,
                        from === process.env.ADMIN_GROUP_JID
                            ? await this.client.group.join(slicedJoinedArgs, mod, username)
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
                    this.client.reply(
                        from,
                        await this.client.group.toggleEvent(from, mentioned || [], admin, iAdmin, command),
                        M
                    )
                    break
                case 'help':
                    this.client.reply(from, { body: help(this.client, slicedJoinedArgs.toLowerCase().trim()) }, M)
                    break
                case 'sticker':
                    const sticker = !media
                        ? { body: responses['wrong-format-media'] }
                        : await createSticker(
                              await this.client.downloadMediaMessage(media),
                              flags.includes('--strech'),
                              barSplit[1],
                              barSplit[2]
                          )
                    const m = await this.client.reply(from, sticker, M)
                    if (m && typeof m === 'object' && (m as WAMessage)?.message?.stickerMessage && ad === 5)
                        return void this.client.reply(from, { body: responses['ads']['sticker'] }, m as WAMessage)
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
                        await this.client.group.register(
                            admin,
                            group.data,
                            command === 'register',
                            slicedJoinedArgs.toLowerCase().trim() as toggleableGroupActions
                        ),
                        M
                    )
                case 'yta':
                case 'ytv':
                    return void this.client.reply(
                        from,
                        await getYTMediaFromUrl(slicedJoinedArgs.trim(), command === 'ytv' ? 'video' : 'audio'),
                        M
                    )
                case 'yts':
                    return void this.client.reply(from, { body: await ytSreach(slicedJoinedArgs.trim()) }, M)
                case 'info':
                    return void this.client.reply(from, info(), M)
                case 'commits':
                case 'issues':
                    return void this.client.reply(from, await getRepoInfo(command), M)
            }
        } catch (err) {
            console.log(err)
            return void this.client.reply(
                from,
                {
                    body: await readFile(join(this.client.assets, 'images', 'Error-500.gif')),
                    caption: !mod ? responses.error[500].regular : responses.error[500].mod.replace('{M}', err.message),
                    type: MessageType.video,
                    mime: Mimetype.gif
                },
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

        const { user, data } = await this.client.getUser(from)
        if (data.ban) return
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
                return void this.client.reply(from, await this.client.group.join(body, mod, username))
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
        const { user, data: userData } = await this.client.getUser(M.participant)
        if (userData.ban) return
        const username = user?.notify || user?.vname || user?.name || ''
        const group = await this.client.getGroupInfo(from)
        const admin = group.admins.includes(user.jid)

        let txt = args[0].toLowerCase()
        let [log, body] = [false, '']
        if (args.includes('@everyone') && admin) {
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

    checkMessageForNSFWandAct = async (M: WAMessage, username: string, metadata: WAGroupMetadata): Promise<boolean> => {
        if (!M.message?.imageMessage) return false
        if (await this.client.ML.nsfw.check(await this.client.downloadMediaMessage(M))) {
            await this.client.reply(metadata.id, { body: responses['nsfw-detected'] }, M)
            await this.client.group.toggleEvent(metadata.id, [M.participant], true, true, 'remove')
            console.log(
                chalk.redBright('[NSFW]'),
                chalk.yellow(moment((M.messageTimestamp as number) * 1000).format('DD/MM HH:mm:ss')),
                'By',
                chalk.red(username),
                'in',
                chalk.red(metadata.subject)
            )
            return true
        }
        return false
    }
}
