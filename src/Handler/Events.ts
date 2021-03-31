import { MessageType, WAParticipantAction } from '@adiwajshing/baileys'
import chalk from 'chalk'
import Client, { Groupinfo } from '../Client'
import Utils from '../Utils'

export class EventHandler {
    constructor(public client: Client) {}

    handle = async (event: event): Promise<void> => {
        const group = await this.client.getGroupInfo(event.jid)
        if (!group.data.events) return
        if (event.action === 'add') return void this.add(event, group)
        if (event.action === 'remove') return this.leave(event)
        console.log(chalk.green('[EVENT]', event.action), chalk.blue('in', group.metadata.subject))
    }

    add = async (event: event, group: Groupinfo): Promise<void> => {
        const participiants = event.participants.map(
            (user) =>
                `${
                    this.client.contacts?.[user]?.['notify'] ||
                    this.client.contacts?.[user]?.['vname'] ||
                    this.client.contacts?.[user]?.['name'] ||
                    user.split('@')[0]
                } `
        )

        const picture = await this.client.getPfp(event.jid)
        const text = `Welcome to ${group.metadata.subject}\n\n${group.metadata.desc}\n\n${participiants}`
        if (picture)
            return void this.client.sendMessage(event.jid, await Utils.download(picture), MessageType.image, {
                caption: text
            })
        return void this.client.sendMessage(event.jid, text, MessageType.text)
    }

    leave = async (event: event): Promise<void> => {
        const user = event.participants[0]
        return void this.client.sendMessage(
            event.jid,
            `Goodbye ${
                this.client.contacts?.[user]?.['notify'] ||
                this.client.contacts?.[user]?.['vname'] ||
                this.client.contacts?.[user]?.['name'] ||
                user.split('@')[0]
            }`,
            MessageType.text
        )
    }
}

export interface event {
    jid: string
    participants: string[]
    actor?: string | undefined
    action: WAParticipantAction
}
