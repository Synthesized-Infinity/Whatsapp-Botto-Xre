import { MessageType } from '@adiwajshing/baileys'
import { Sticker } from 'wa-sticker-formatter'

export default async (data: Buffer, crop: boolean, author = 'Xre', pack = 'WhatsApp Botto') => {
    const sticker = new Sticker(data, {
        crop,
        author,
        pack
    })
    await sticker.build()
    return { body: await sticker.get(), type: MessageType.sticker }
}

export interface stickerOptions {
    animated?: boolean,
    crop?: boolean,
    author?: string
    pack?: string
}