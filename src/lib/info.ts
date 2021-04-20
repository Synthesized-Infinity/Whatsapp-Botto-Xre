import { MessageType } from '@adiwajshing/baileys'
import { join } from 'path'
import { IReply } from '../Typings'
import Utils from '../Utils'

const xre = `https://opengraph.githubassets.com/e3ea92ae0b9155ea89ae7afad6a83898b4555bf33b7c0abeef478ba694de5e1f/Synthesized-Infinity/Whatsapp-Botto-Xre`
export const info = async (): Promise<IReply> => {
    //eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(join(__dirname, '..', '..', 'package.json'))
    const deps = Object.keys(pkg.dependencies)
    return {
        body: await Utils.download(xre),
        caption: `🤖 ${process.env.BOT_NAME} 🤖\n\n🌟 *Homepage:* ${pkg.homepage}\n\n🍀 *Repository:* ${
            pkg.repository.url
        }\n\n🍁 *Dependencies:*\n${deps.join(
            '\n'
        )}\n\n🌇 *Stickers:* https://www.npmjs.com/package/wa-sticker-formatter\n\n🛠️ *APIs & Tools:* https://express-is-fun.herokuapp.com/api/endpoints\n\n*-ᴡᴀ-ʙᴏᴛᴛᴏ-xʀᴇ-*`,
        type: MessageType.image
    }
}

export const getRepoInfo = async (type: 'issues' | 'commits'): Promise<IReply> => {
    const data = await Utils.fetch(`https://api.github.com/repos/Synthesized-Infinity/Whatsapp-Botto-Xre/${type}`, {})
    if (!data[0]) return { body: '💮 *No Issues open* 💮' }
    let body = `🌟 *WhatsApp Botto Xre-Recent ${Utils.capitalize(type)}* 🌟\n\n`
    const len = data.length < 5 ? data.length : 5
    if (type === 'commits') {
        for (let c = 0; c < len; c++) {
            body += `*#${c + 1}.*\n✉️ *Commit Message:* ${data[c].commit.message}\n📅 *Date:* ${
                data[c].commit.author.date
            }\n🔱 *Author:* ${data[c].commit.author.name}\n🍀 *URL*: ${data[c]['html_url']}\n\n`
        }
        return { caption: body, body: await Utils.download(`${xre}/commit/${data[0].sha}`), type: MessageType.image }
    }
    for (let i = 0; i < data.length; i++) {
        body += `*#${i + 1}.*\n\n🔴 *Title: ${data[i].title}*\n🔱 *User:* ${data[i].user.login}\n〽️ URL: ${
            data[i].url
        }\n\n`
    }
    return { body }
}
