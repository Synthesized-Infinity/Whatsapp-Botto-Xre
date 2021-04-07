import { IEmbed } from '../Typings'

export default class Embed implements IEmbed {
    header = `ᴇᴍʙᴇᴅ ᴛᴇxᴛ`

    body = ''

    footer = 'ᴡᴀ-ʙᴏᴛᴛᴏ-xʀᴇ'

    constructor(config?: IEmbed) {
        if (config?.header) this.setHeader(config.header)
        if (config?.body) this.setBody(config.body)
        if (config?.footer) this.setFooter(config.footer)
    }

    setHeader = (header: string): void => {
        this.header = header
    }

    setBody = (body: string): void => {
        const args = body.split('\n')
        body = ''
        args.forEach((text) => (body += `┠≽ ${text}`))
    }

    setFooter = (footer: string): void => {
        this.footer = footer
    }

    get = (): string => {
        return `┏〈 ${this.header} 〉\n ╽\n${this.body}\n╿\n╰╼≽`
    }
}
