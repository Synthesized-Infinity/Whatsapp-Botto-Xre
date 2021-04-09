import { MessageType } from '@adiwajshing/baileys'
import { Sticker } from 'wa-sticker-formatter'
import { IReply } from '../Typings'

export const createSticker = async (data: Buffer, crop: boolean, author = 'Xre', pack = 'WhatsApp Botto'): Promise<IReply> => {
    const sticker = new Sticker(data, {
        crop,
        author,
        pack
    })
    await sticker.build()
    return { body: await sticker.get(), type: MessageType.sticker }
}
