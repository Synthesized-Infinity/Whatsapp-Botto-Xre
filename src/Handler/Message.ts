import { MessageType, Mimetype, proto, WAGroupMetadata, WAMessage, WA_MESSAGE_STUB_TYPE } from '@adiwajshing/baileys'
import chalk from 'chalk'
import { Client } from '../Client'
import {
    createSticker,
    help,
    toggleableGroupActions,
    getWById,
    wSearch,
    ytSearch,
    getYTMediaFromUrl,
    lyrics,
    convertStickerToImage,
    convertStickerToVideo,
    getGifReply
} from '../lib'
import moment from 'moment-timezone'
import responses from '../lib/responses.json'
import Utils from '../Utils'
import { IParsedArgs } from '../Typings'
import { readFile } from 'fs-extra'
import { join } from 'path'
import { getRepoInfo, info } from '../lib/info'
import { wallpaper } from '../lib/wallpaper'
import { reddit } from '../lib/reddit'
import { tmpdir } from 'os'
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
        const { body, media } = this.getBase(M, message)

        if (group.data.mod && !admin && iAdmin && !(await this.moderate(M, body || '', group.metadata, username)))
            return void null
        if (group.data.safe && !admin && iAdmin && (await this.checkMessageandAct(M, username, group.metadata)))
            return void null
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

        const mentioned =
            message?.extendedTextMessage?.contextInfo?.mentionedJid &&
            message.extendedTextMessage.contextInfo.mentionedJid.length > 0
                ? message.extendedTextMessage.contextInfo?.mentionedJid
                : message.extendedTextMessage?.contextInfo?.quotedMessage &&
                  message.extendedTextMessage.contextInfo.participant
                ? [message.extendedTextMessage.contextInfo.participant]
                : []
        const tag = mentioned[0] || sender
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
                case 'bc':
                    if (!mod) return void null
                    return void this.client.reply(from, {
                        body: await this.client.group.broadcast(slicedJoinedArgs, media || M)
                    })
                case 'id':
                    return void this.client.reply(from, { body: `GID: ${from}` }, M)
                case 'profile':
                    return void this.client.reply(
                        from,
                        await this.client.getUserProfile(
                            tag,
                            tag === sender ? { user, data: userData } : await this.client.getUser(tag),
                            group.admins.includes(tag)
                        ),
                        M
                    )
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
                case 'hi':
                    this.client.reply(from, { body: `Hi! ${username}` }, M)
                    break
                case 'promote':
                case 'demote':
                case 'remove':
                    this.client.reply(
                        from,
                        await this.client.group.toggleEvent(from, mentioned, admin, iAdmin, command),
                        M
                    )
                    break
                case 'help':
                    this.client.reply(from, { body: help(this.client, slicedJoinedArgs.toLowerCase().trim()) }, M)
                    break
                case 'img':
                    return void (await this.client.reply(
                        from,
                        !media || !M.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage
                            ? { body: `Tag the sticker you want to convert` }
                            : M.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage.isAnimated
                            ? await convertStickerToVideo(
                                  await this.client.downloadAndSaveMediaMessage(
                                      media,
                                      `${tmpdir()}/${Math.random().toString(36)}`
                                  )
                              )
                            : await convertStickerToImage(
                                  await this.client.downloadAndSaveMediaMessage(
                                      media,
                                      `${tmpdir()}/${Math.random().toString(36)}`
                                  )
                              ),
                        M
                    ))
                case 'sticker':
                    const sticker =
                        !media || M.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage
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
                case 'wallpaper':
                    return void this.client.reply(from, await wallpaper(slicedJoinedArgs), M)
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
                    return void this.client.reply(from, { body: await ytSearch(slicedJoinedArgs.trim()) }, M)
                case 'gify':
                    return void this.client.reply(from, await getGifReply(slicedJoinedArgs), M)
                case 'slap':
                case 'pat':
                case 'punch':
                    return void this.client.reply(
                        from,
                        await getGifReply(command, [
                            username,
                            this.client.contacts[tag].notify ||
                                this.client.contacts[tag].vname ||
                                this.client.contacts[tag].name ||
                                'User'
                        ])
                    )
                case 'lyrics':
                    return void this.client.reply(from, { body: await lyrics(slicedJoinedArgs) }, M)
                case 'info':
                    return void this.client.reply(from, await info(), M)
                case 'commits':
                case 'issues':
                    return void this.client.reply(from, await getRepoInfo(command), M)
                case 'open':
                case 'close':
                    return void this.client.reply(
                        from,
                        await this.client.group.announce(group.metadata, admin, iAdmin, command === 'close')
                    )
                case 'purge':
                    return void this.client.reply(
                        from,
                        await this.client.group.purge(group.metadata, sender, iAdmin),
                        M
                    )
                case 'delete':
                    return void this.client.reply(
                        from,
                        { body: admin ? await this.client.deleteQuotedMessage(M) : responses['user-lacks-permission'] },
                        M
                    )
                case 'subred':
                    return void this.client.reply(from, await reddit(slicedJoinedArgs, !group.data.nsfw), M)
            }
        } catch (err) {
            console.log(err)
            return void this.client.reply(
                from,
                {
                    body: await readFile(join(this.client.assets, 'images', 'Error-500.gif')),
                    //eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    //@ts-ignore
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

    validate = (Msg: WAMessage): { type: MessageType; chat: 'group' | 'dm' } | false => {
        const M = Msg.message?.ephemeralMessage || Msg
        if (!M.message) return false
        if (!!Msg.key.fromMe) return false
        if (Msg.key.remoteJid?.endsWith('broadcast')) return false
        const type = Object.keys(M.message)[0]
        if (!this.validTypes.includes(type as MessageType)) return false
        return { type: type as MessageType, chat: Msg.key.remoteJid?.endsWith('g.us') ? 'group' : 'dm' }
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
                  message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage ||
                  message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage
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

    checkMessageandAct = async (M: WAMessage, username: string, metadata: WAGroupMetadata): Promise<boolean> => {
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

    moderate = async (M: WAMessage, text: string, metadata: WAGroupMetadata, username: string): Promise<boolean> => {
        if (this.checkForGroupLink(text)) {
            await this.client.reply(M.key.remoteJid as string, { body: responses['mod']['group-invite'] }, M)
            await this.client.groupRemove(M.key.remoteJid as string, [M.participant])
            console.log(
                chalk.redBright('[MOD] GROUP LINK'),
                chalk.yellow(moment((M.messageTimestamp as number) * 1000).format('DD/MM HH:mm:ss')),
                'By',
                chalk.red(username),
                'in',
                chalk.red(metadata.subject)
            )
            return false
        }
        return true
    }

    checkForGroupLink = (text: string): boolean => text.includes('chat.whatsapp.com')

    isMessageSafe = (M: WAMessage): boolean => {
        if (M.messageStubType === WA_MESSAGE_STUB_TYPE.OVERSIZED) return false
        return true
    }

    loopText = (inc: number): string => {
        let text = `\n`
        for (let i = 0; i < inc; i++) text += `\n`
        return text
    }
}
