import Client from '../Client'
import commands from './commands.json'
import Utils from '../Utils'
import responses from './responses.json'

export const help = (client: Client, command?: string): string => {
    if (command) {
        for (const catogary in commands) {
            for (const index of (commands as commandList)[catogary]) {
                if (index.command === command) {
                    return `💮 *Prefix ${client._config.prefix}*\n\n*Note! Use The Prefix infront of the command while using*\n\n*🌲 Command:* ${index.command}\n📗 *Description:* ${index.description}\n💚 *Usage:* ${index.usage}`
                }
            }
        }
        return responses['invalid-command-short'].replace('{C}', command)
    }
    let base = `🤖 ${client._config.name} Command List 🤖\n\n💮 *Prefix ${client._config.prefix}*\n\n`
    const cmds = commands as commandList
    const cats = Object.keys(cmds)
    for (const cat in cmds) {
        base += `${Utils.capitalize(cat)} ${Utils.emojies[cats.indexOf(cat)]}\n\`\`\``
        cmds[cat].forEach((cmd) => {
            base += `${cmd.command}${cmds[cat][cmds[cat].length - 1] === cmd ? '' : ', '}`
        })
        base += '```\n\n'
    }
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
