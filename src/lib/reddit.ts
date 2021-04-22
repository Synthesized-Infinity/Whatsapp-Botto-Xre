import { readFile } from 'fs-extra'
import { join } from 'node:path'
import { IReply } from '../Typings'
import Utils from '../Utils'
import responses from './responses.json'

export const reddit = async (subreddit: string, safe: boolean): Promise<IReply> => {
    if (!subreddit) return { body: responses['wrong-format'] }
    try {
        const post = await Utils.fetch(`https://meme-api.herokuapp.com/gimme/${encodeURI(subreddit)}`, {})
        if (post.nsfw && safe)
            return { body: await readFile(join(__dirname, '..', '..', 'assets', '18+.jpg')), caption: `` }
        return {
            body: await Utils.download(post.url),
            caption: `📗*Title:* ${post.title}\n📘*Author:* ${post.author}\n📙*Post:* ${post.postLink}`
        }
    } catch (err) {
        return { body: err.response.data.error }
    }
}
