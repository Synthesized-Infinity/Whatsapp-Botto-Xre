import chalk from 'chalk'

export const validate = (): void => {
    const missing: string[] = []
    if (!process.env.SESSION_ID) missing.push('SESSION_ID')
    if (!process.env.MONGO_URI) missing.push('MONGO_URI')
    if (missing.length > 0) {
        console.log(
            chalk.redBright(`[${missing.length}] Missing Config Vars`),
            chalk.yellow(`\nSpecify the following config vars in your ".env" file or add them to your env variables`),
            chalk.blue(`\n${missing.join('\n')}`),
            chalk.green(
                `\nNeed help? Read the self-hosting guide. https://github.com/Synthesized-Infinity/Whatsapp-Botto-Xre/blob/master/Self-Hosting.md`
            )
        )
        process.exit()
    }
}
