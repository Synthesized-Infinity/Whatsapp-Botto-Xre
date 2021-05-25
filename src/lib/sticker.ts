import { MessageType, Mimetype } from '@adiwajshing/baileys'
import { exec } from 'child_process'
import { Sticker } from 'wa-sticker-formatter'
import { IReply } from '../Typings'
import { promisify } from 'util'
import { tmpdir } from 'os'
import { promises as fs } from 'fs'
const execute = promisify(exec)
const webp = require('node-webpmux')

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
    return { body: await fs.readFile(out), type: MessageType.image, caption: `Here you go.` }
}

// this could probably be made better, but it works for now
export const convertStickerToVideo = async (filename: string): Promise<IReply> => {
    const img = new webp.Image()
    const temp = tmpdir()
    const out = `${temp}/${Math.random().toString(36)}.mp4`

    // load sticker
    await img.load(filename)

    // get amount of frames
    let frames = img.anim.frames.length

    for (let i = 0; frames > i; i++) {
        await execute(`webpmux -get frame ${i} ${filename} -o ${temp}/${i}.webp`)
        await execute(`dwebp ${temp}/${i}.webp -o ${temp}/${i}.png`)
    }

    // build frames into mp4
    await execute(`ffmpeg -framerate 22 -i ${temp}/%d.png -y -c:v libx264 -pix_fmt yuv420p -loop 4 ${out}`)

    // delete frames
    for (frames === 0; frames--; ) {
        fs.unlink(`${temp}/${frames}.webp`)
        fs.unlink(`${temp}/${frames}.png`)
    }

    return { body: await fs.readFile(out), type: MessageType.video, mime: Mimetype.gif, caption: `Here you go.` }
}
