import { MessageType, WAGroupModification } from '@adiwajshing/baileys'
import Client from '../Client'
import Utils from '../Utils'
import responses from './responses.json'
import moment from 'moment-timezone'
import { IGroup, IGroupinfo, IReply } from '../Typings'
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
                contacts.forEach((user) => this.client.groupRemove(chat, [user]))
        }
        if (mod.status >= 200 && mod.participants)
            return {
                body: `Execution Successful\n\n${Utils.capitalize(type)}:\n${mod.participants
                    .map((user: { [k: string]: { code: number } }) => {
                        const key = Object.keys(user)?.[0]
                        if (!key || user[key].code < 200) return ''
                        const conatct = this.client.contacts[key]
                        return conatct?.notify || conatct?.vname || conatct?.name || key.split('@')[0]
                    })
                    .join('\n')}`
            }
        else return { body: responses['invalid-context'] }
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
        if (register && chat[type]) return { body: responses['already-enabled'].replace('{T}', Utils.capitalize(type)) }
        await this.client.GroupModel.updateOne({ jid: chat.jid }, { $set: { [type]: register } })
        return { body: responses['enable-sucessful'].replace('{T}', Utils.capitalize(type)) }
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
                            : `🎊 Sucessfully Joined!\n\n🎋 *Title:* ${metadata.subject}\n🏊 *Participiants:* ${metadata.participants.length}\n📑 *Description:* ${metadata.desc}\n👑 *Created By:* ${metadata.owner}`
                    }
                }
                return { body: responses['failed-to-join'] }
            } catch (err) {
                console.log(err)
                return { body: responses['failed-to-join'] }
            }
        }
    }

    simplifiedGroupInfo = async (info: IGroupinfo): Promise<IReply> => {
        const { metadata, data } = info
        const [events, NSFW, icon] = [data?.events || false, data?.nsfw || false, await this.client.getPfp(metadata.id)]
        const owner = this.client.contacts[metadata.owner]
        return {
            body: icon ? await Utils.download(icon) : Utils.yui404,
            caption: `💮 *Title:* ${metadata.subject}\n\n👑 *Created By:* ${
                owner?.notify || owner?.vname || owner?.name || metadata.owner.split('@')[0]
            }\n\n📅 *Created On:* ${moment(metadata.creation * 1000).format('DD/MM HH:mm:ss')}\n\n🔊 *Announce:* ${
                metadata.announce || false
            }\n\n🍀 *Restricted:* ${metadata.restrict || metadata.restrict || false}\n\n🏊 *Participiants:* ${
                metadata.participants.length
            }\n\n🏅 *Admins:* ${
                metadata.participants.filter((participiant) => participiant.isAdmin).length
            }\n\n🔮 *Events:* ${events}\n\n🔞 *NSFW:* ${NSFW}\n\n〽 *Description:* ${metadata.desc}`,
            type: MessageType.image
        }
    }
}

export enum toggleableGroupActions {
    events = 'events',
    NSFW = 'nsfw'
}
