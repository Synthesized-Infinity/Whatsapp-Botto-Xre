import Client, { Reply } from '../Client'
import { IGroup } from '../Mongo/Models'
import Utils from '../Utils'
import responses from './responses.json'

export class GroupEx {
    constructor(public client: Client) {}

    toggleEvent = (
        chat: string,
        contacts: string[],
        uia: boolean,
        xim: boolean,
        type: 'promote' | 'demote' | 'remove'
    ): Reply => {
        if (!uia) return { body: responses['user-lacks-permission'] }
        if (!xim) return { body: responses['no-permission'] }
        if (contacts.length === 0) return { body: responses['wrong-format'] }
        switch (type) {
            case 'demote':
                this.client.groupDemoteAdmin(chat, contacts)
                break
            case 'promote':
                this.client.groupMakeAdmin(chat, contacts)
                break
            case 'remove':
                contacts.forEach((user) => this.client.groupRemove(chat, [user]))
        }
        return {
            body: `Execution Successful\n\n${Utils.capitalize(type)}:\n${contacts.map((user) => user.split('@')[0])}`
        }
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
}
