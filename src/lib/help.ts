import Client from '../Client'
import commands from './commands.json'
import Utils from '../Utils'

export const help = (client: Client): string => {
    const keys = Object.keys(commands)
    let base = `🤖 ${client._config.name} Command List 🤖\n\n`
    base += `💮 *Prefix ${client._config.prefix}*\n\n`
    keys.forEach((key) => {
        base += `*${Utils.capitalize(key)}* ⚡\n`
        /* eslint-disable @typescript-eslint/no-explicit-any*/
        base += `\`\`\`${(commands as any)[key].map((cmd: command) => `${cmd.command} `)}\`\`\`\n\n`
    })
    return base
}
export interface commandList {
    [catogary: string]: command[]
}

export interface command {
    command: string
    description: string
    usage: string
    flags?: string[]
}
