import { join } from "path";
import { IReply } from "../Typings";
import Utils from '../Utils'
export const info = (): IReply => {
    //eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(join(__dirname, '..', '..', 'package.json'))
    const deps = Object.keys(pkg.dependencies)
    return { body: `🤖 ${process.env.BOT_NAME} 🤖\n\n🌟 *Homepage:* ${pkg.homepage}\n\n🍀 *Repository:* ${pkg.repository.url}\n\n🍁 *Dependencies:*\n${deps.join('\n')}\n\n🌇 *Stickers:* https://www.npmjs.com/package/wa-sticker-formatter\n\n🛠️ *APIs & Tools:* https://express-is-fun.herokuapp.com/api/endpoints\n\n*-ᴡᴀ-ʙᴏᴛᴛᴏ-xʀᴇ-*`}
}

export const getCommits = async (): Promise<IReply> => {
    const commits = await Utils.fetch(`https://api.github.com/repos/SomnathDas/Whatsapp-Botto-Xre/commits`, {})
    let body = `🌟 *WhatsApp Botto Xre-Recent Commits* 🌟\n\n`
    const len = (commits.length < 5) ? commits.length : 5
    for (let c = 0; c < len; c++) {
        body += `#${c+1}.\n✉️ *Commit Message:* ${commits[c].commit.message}\n📅 *Date:* ${commits[c].commit.author.date}\n🔱 *Author:* ${commits[c].commit.author.name}\n🍀 *URL*: ${commits[c]['html_url']}\n\n`
    }
    return { body }
}