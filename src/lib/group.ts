import { WAGroupModification } from '@adiwajshing/baileys'
import Client, { Reply } from '../Client'
import { IGroup } from '../Mongo/Models'
import Utils from '../Utils'
import responses from './responses.json'

export class GroupEx {
    constructor(public client: Client) {}

    toggleEvent = async (
        chat: string,
        contacts: string[],
        uia: boolean,
        xim: boolean,
        type: 'promote' | 'demote' | 'remove'
    ): Promise<Reply> => {
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

    register = async (admin: boolean, chat: IGroup, register: boolean, type: string): Promise<Reply> => {
        if (!admin) return { body: responses['user-lacks-permission'] }
        if (register) {
            switch (type) {
                case 'events':
                    if (chat.events)
                        return {
                            body: responses['already-enabled'].replace('{T}', 'Events')
                        }
                    await this.client.GroupModel.updateOne({ jid: chat.jid }, { $set: { events: true } })
                    return {
                        body: responses['enable-sucessful'].replace('{T}', 'Events')
                    }
                case 'nsfw':
                    if (chat.nsfw) return { body: responses['already-enabled'].replace('{T}', 'NSFW') }
                    await this.client.GroupModel.updateOne({ jid: chat.jid }, { $set: { nsfw: true } })
                    return {
                        body: responses['enable-sucessful'].replace('{T}', 'NSFW')
                    }
                default:
                    return {
                        body: `${responses['wrong-format']} | Invalid Type: ${type}`
                    }
            }
        } else {
            switch (type) {
                case 'events':
                    if (!chat.events)
                        return {
                            body: responses['not-enabled'].replace('{T}', 'Events')
                        }
                    await this.client.GroupModel.updateOne({ jid: chat.jid }, { $set: { events: false } })
                    return {
                        body: responses['disable-successful'].replace('{T}', 'Events')
                    }
                case 'nsfw':
                    if (!chat.nsfw)
                        return {
                            body: responses['not-enabled'].replace('{T}', 'NSFW')
                        }
                    await this.client.GroupModel.updateOne({ jid: chat.jid }, { $set: { nsfw: false } })
                    return {
                        body: responses['disable-successful'].replace('{T}', 'NSFW')
                    }
                default:
                    return {
                        body: `${responses['wrong-format']} | Invalid Type: ${type}`
                    }
            }
        }
    }

    async join(text: string, mod: boolean, username = 'User'): Promise<Reply> {
        const regExec = Utils.urlMatch(text)
        if (!regExec) return { body: responses['no-url-provided'] }
        if (!mod) {
            if (this.client._config.adminGroupId || this.client._config.admins[0]) {
                void (await this.client.reply(this.client._config.adminGroupId || this.client._config.admins[0], {
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
}
