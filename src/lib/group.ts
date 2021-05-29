import { GroupSettingChange, MessageType, WAGroupMetadata, WAGroupModification, WAMessage } from '@adiwajshing/baileys'
import { Client } from '../Client'
import Utils from '../Utils'
import responses from './responses.json'
import moment from 'moment-timezone'
import { IGroup, IGroupInfo, IReply } from '../Typings'
import { join } from 'path'
import { readFile } from 'fs-extra'
export class GroupEx {
    constructor(public client: Client) {}

    toggleEvent = async (
        chat: string,
        contacts: string[],
        uia: boolean,
        xim: boolean,
        type: 'promote' | 'demote' | 'remove'
    ): Promise<IReply> => {
        if (!uia) return { body: responses['user-lacks-permission'] }
        if (!xim) return { body: responses['no-permission'] }
        if (contacts.length === 0) return { body: responses['wrong-format'] }
        let mod: WAGroupModification = { status: 0 }
        switch (type) {
            case 'demote':
                mod = await this.client.groupDemoteAdmin(chat, contacts)
                break
            case 'promote':
                mod = await this.client.groupMakeAdmin(chat, contacts)
                break
            case 'remove':
                contacts.map(async (user) => await this.client.groupRemove(chat, [user]))
        }
        return {
            body: `Execution Successful\n\n${Utils.capitalize(type)}:\n${
                !mod.participants
                    ? contacts
                          .map((user) => {
                              const conatct = this.client.contacts[user]
                              return conatct?.notify || conatct?.vname || conatct?.name || user.split('@')[0]
                          })
                          .join('\n')
                    : mod?.participants
                          .map((user: { [k: string]: { code: number } }) => {
                              const key = Object.keys(user)?.[0]
                              if (!key || user[key].code < 200) return ''
                              const conatct = this.client.contacts[key]
                              return conatct?.notify || conatct?.vname || conatct?.name || key.split('@')[0]
                          })
                          .join('\n')
            }`
        }
    }

    register = async (
        admin: boolean,
        chat: IGroup,
        register: boolean,
        type: toggleableGroupActions
    ): Promise<IReply> => {
        if (!admin) return { body: responses['user-lacks-permission'] }
        if (!Object.values(toggleableGroupActions).includes(type))
            return { body: responses['invalid-group-action'].replace('{A}', type) }
        if (register && chat[type])
            return {
                body: responses[register ? 'already-enabled' : 'not-enabled'].replace('{T}', Utils.capitalize(type))
            }
        await this.client.GroupModel.updateOne({ jid: chat.jid }, { $set: { [type]: register } })
        return {
            body: responses[register ? 'enable-successful' : 'disable-successful'].replace(
                '{T}',
                Utils.capitalize(type)
            )
        }
    }

    join = async (text: string, mod: boolean, username = 'User'): Promise<IReply> => {
        const regExec = Utils.urlMatch(text)
        if (!regExec) return { body: responses['no-url-provided'] }
        if (!mod) {
            if (process.env.ADMIN_GROUP_JID || this.client._config.admins[0]) {
                void (await this.client.reply(process.env.ADMIN_GROUP_JID || this.client._config.admins[0], {
                    body: responses['join-request'].replace('{A}', username).replace('{L}', regExec[0])
                }))
                return { body: responses['join-req-forwarded'] }
            } else return { body: responses['cannot-process-request'] }
        } else {
            try {
                const all = this.client.chats.all().map((chat) => chat.jid)
                const group = await this.client.acceptInvite(regExec[0].split('m/')[1])
                if (group?.gid) {
                    const metadata = await this.client.groupMetadata(group.gid)
                    return {
                        body: all.includes(group.gid)
                            ? `Already in ${metadata.subject}`
                            : `🎊 Sucessfully Joined!\n\n🎋 *Title:* ${metadata.subject}\n🏊 *Participants:* ${metadata.participants.length}\n📑 *Description:* ${metadata.desc}\n👑 *Created By:* ${metadata.owner}`
                    }
                }
                return { body: responses['failed-to-join'] }
            } catch (err) {
                console.log(err)
                return { body: responses['failed-to-join'] }
            }
        }
    }

    simplifiedGroupInfo = async (info: IGroupInfo): Promise<IReply> => {
        const { metadata, data } = info
        const [mod, safe, events, NSFW, icon] = [
            data?.mod || false,
            data?.safe || false,
            data?.events || false,
            data?.nsfw || false,
            await this.client.getPfp(metadata.id)
        ]
        const owner = this.client.contacts[metadata.owner]
        return {
            body: icon ? await Utils.download(icon) : await readFile(join(this.client.assets, 'images', 'yui.jpg')),
            caption: `💮 *Title:* ${metadata.subject}\n\n👑 *Created By:* ${
                owner?.notify || owner?.vname || owner?.name || metadata.owner.split('@')[0]
            }\n\n📅 *Created On:* ${moment(metadata.creation * 1000).format('DD/MM HH:mm:ss')}\n\n🔊 *Announce:* ${
                metadata.announce || false
            }\n\n🍀 *Restricted:* ${metadata.restrict || metadata.restrict || false}\n\n🏊 *Participants:* ${
                metadata.participants.length
            }\n\n🏅 *Admins:* ${
                metadata.participants.filter((participant: { isAdmin: unknown }) => participant.isAdmin).length
            }\n\n🎯 *Moderation:* ${mod}\n\n🔮 *Events:* ${events}\n\n🌟 *Safe:* ${safe}\n\n🔞 *NSFW:* ${NSFW}\n\n〽 *Description:* \n${
                metadata.desc
            }`,
            type: MessageType.image
        }
    }

    announce = async (metadata: WAGroupMetadata, admin: boolean, me: boolean, announce: boolean): Promise<IReply> => {
        if (!admin) return { body: responses['user-lacks-permission'] }
        if (!me) return { body: responses['no-permission'] }
        if (!announce && !metadata.announce) return { body: `The group is already open` }
        if (announce && metadata.announce) return { body: `The group is already closed` }
        await this.client.groupSettingChange(metadata.id, GroupSettingChange.messageSend, announce)
        return { body: `The group is now ${announce ? 'Closed' : 'Opened'}` }
    }

    purge = async (metadata: WAGroupMetadata, sender: string, me: boolean): Promise<IReply> => {
        if (metadata.owner !== sender && metadata.owner !== sender.replace('s.whatsapp.net', 'c.us'))
            return { body: responses['not-owner'] }
        if (!me) return { body: responses['no-permission'] }
        if (!this.purgeSet.has(metadata.id)) {
            this.addToPurge(metadata.id)
            return { body: responses.warnings.purge }
        }
        const participants = metadata.participants.map((user) => user.jid)
        for (const user of participants) {
            if (!(user === metadata.owner || user === this.client.user.jid))
                await this.client.groupRemove(metadata.id, [user])
        }
        return { body: 'Done!' }
    }

    purgeSet = new Set<string>()

    addToPurge = async (id: string): Promise<void> => {
        this.purgeSet.add(id)
        setTimeout(() => this.purgeSet.delete(id), 60000)
    }

    broadcast = async (text: string, M: WAMessage): Promise<string> => {
        if (!text) return `The Broadcast Message can't be Empty`
        const chats = this.client.chats.all().filter((chat) => chat.jid.endsWith('g.us'))
        const img = await (M.message?.imageMessage
            ? this.client.downloadMediaMessage(M)
            : readFile(join(__dirname, '..', '..', 'assets', 'images', 'broadcast.png')))
        const bc = `${text}\n\n*[${this.client._config.name} BROADCAST]*`
        const groups: string[] = []
        for (const chat of chats) {
            if (!chat.read_only) {
                try {
                    await this.client.sendMessage(chat.jid, img, MessageType.image, { caption: bc })
                    groups.push(chat.metadata?.subject || '')
                } catch (err) {
                    console.log(err.msg)
                    continue
                }
            }
        }
        return `📣 *Broadcast: ${text}*\n\n💌 *Sent to:*\n${groups.join('\n')}`
    }
}

export enum toggleableGroupActions {
    events = 'events',
    NSFW = 'nsfw',
    safe = 'safe',
    mod = 'mod'
}
