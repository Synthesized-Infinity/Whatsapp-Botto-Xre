import { MessageType } from '@adiwajshing/baileys'
import { exec } from 'child_process'
import { Sticker } from 'wa-sticker-formatter'
import { IReply } from '../Typings'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { promises as fs } from 'fs'
const execute = promisify(exec)

export const createSticker = async (
    data: Buffer,
    crop: boolean,
    author = 'Xre',
    pack = 'WhatsApp Botto'
): Promise<IReply> => {
    const sticker = new Sticker(data, {
        crop,
        author,
        pack
    })
    await sticker.build()
    return { body: await sticker.get(), type: MessageType.sticker }
}

export const convertStickerToImage = async (filename: string): Promise<IReply> => {
    const out = `${tmpdir()}/${Math.random().toString(36)}.png`
    await execute(`dwebp "${filename}" -o "${out}"`)
    return { body: await fs.readFile(out), type: MessageType.image, caption: `Here you go.`}
}
