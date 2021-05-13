import { MessageType } from '@adiwajshing/baileys'
import chalk from 'chalk'
import { Client } from '../Client'
import Utils from '../Utils'
import moment from 'moment-timezone'
import { IEvent, IGroupInfo } from '../Typings'
export class EventHandler {
    constructor(public client: Client) {}

    handle = async (event: IEvent): Promise<void> => {
        const group = await this.client.getGroupInfo(event.jid)
        if (!group.data.events) return
        console.log(
            chalk.green('[EVENT]'),
            chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
            chalk.blueBright(event.action),
            chalk.yellow('in'),
            chalk.blueBright(group.metadata.subject)
        )

        if (event.action === 'add') return void this.add(event, group)
        if (event.action === 'remove') return this.leave(event)
    }

    add = async (event: IEvent, group: IGroupInfo): Promise<void> => {
        const participants = event.participants.map(
            (user) =>
                `${
                    this.client.contacts?.[user]?.['notify'] ||
                    this.client.contacts?.[user]?.['vname'] ||
                    this.client.contacts?.[user]?.['name'] ||
                    user.split('@')[0]
                } `
        )

        const picture = await this.client.getPfp(event.jid)
        const text = `Welcome to ${group.metadata.subject}\n\n${group.metadata.desc}\n\n${participants}`
        if (picture)
            return void this.client.sendMessage(event.jid, await Utils.download(picture), MessageType.image, {
                caption: text
            })
        return void this.client.sendMessage(event.jid, text, MessageType.text)
    }

    leave = async (event: IEvent): Promise<void> => {
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
