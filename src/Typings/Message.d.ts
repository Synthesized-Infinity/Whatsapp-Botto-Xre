import { Mimetype, WAGroupMetadata } from '@adiwajshing/baileys'

export interface IParsedArgs {
    args: string[]
    flags: string[]
}

export interface ICommandList {
    [category: string]: command[]
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

export interface IReply {
    body: string | Buffer
    type?: MessageType
    caption?: string
    mime?: Mimetype
}

export interface IGroupInfo {
    metadata: WAGroupMetadata
    admins: string[]
    data: IGroup
}
