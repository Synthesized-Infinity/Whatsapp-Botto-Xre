import Client from '../Client'
import Utils from '../Utils'
import respones from './responses.json'

export class GroupEx {

    constructor(public client: Client) {

    }

    toggleEvent(chat: string, user: string, contacts: string[], uia: boolean, xim: Boolean, type: 'promote' | 'demote' | 'remove') {
        if (!uia) return { body: respones['user-lacks-permission']}
        if (!xim) return { body: respones['no-permission']}
        if (contacts.length === 0) return { body: respones['wrong-format']}
        switch(type) {
            case 'demote':
                this.client.groupDemoteAdmin(chat, contacts)
                break
            case 'promote':
                this.client.groupMakeAdmin(chat, contacts)
                break
            case 'remove':
                contacts.forEach((user) => this.client.groupRemove(chat, [user]))
        }
        return { body: `Execution Successful\n\n${Utils.capitalize(type)}:\n${contacts.map((user) => user.split('@')[0])}`}

    }

}