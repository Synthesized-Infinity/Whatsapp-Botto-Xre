import { join } from "path";
import { IReply } from "../Typings";

export const info = (): IReply => {
    //eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(join(__dirname, '..', '..', 'package.json'))
    const deps = Object.keys(pkg.dependencies)
    return { body: `🤖 ${process.env.BOT_NAME} 🤖\n\n🌟 *Homepage:* ${pkg.homepage}\n\n🍀 *Repository:* ${pkg.repository.url}\n\n🍁 *Dependencies:*\n${deps.join('\n')}\n\n🌇 *Stickers:* https://www.npmjs.com/package/wa-sticker-formatter\n\n🛠️ *APIs & Tools:* https://express-is-fun.herokuapp.com/api/endpoints\n\n*-ᴡᴀ-ʙᴏᴛᴛᴏ-xʀᴇ-*`}
}