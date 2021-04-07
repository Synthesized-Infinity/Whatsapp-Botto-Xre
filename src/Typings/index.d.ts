import { WAGroupMetadata } from '@adiwajshing/baileys'
import { Document } from 'mongoose'
export interface IGroupinfo {
    metadata: WAGroupMetadata
    admins: string[]
    data: IGroup
}

export interface IConfig {
    name: string
    prefix: string
    admins: string[]
    adminGroupId: ''
    cron: string | null
}

export interface IReply {
    body: string | Buffer
    type?: MessageType
    caption?: string
}

export interface IEvent {
    jid: string
    participants: string[]
    actor?: string | undefined
    action: WAParticipantAction
}

export interface IParsedArgs {
    args: string[]
    flags: string[]
}

export interface ICommandList {
    [catogary: string]: command[]
}

export interface ICommand {
    command: string
    description: string
    usage: string
    flags?: string[]
}

export interface IGroupModel extends IGroup, Document {}
export interface IGroup {
    jid: string
    events: boolean
    nsfw: boolean
}

export interface IUserModel extends IUser, Document {}
export interface IUser {
    jid: string
    ban: boolean
    warnings: number
}

export interface IEmbed {
    header?: string
    body?: string
    footer?: string
}

export interface stickerOptions {
    animated?: boolean
    crop?: boolean
    author?: string
    pack?: string
}
