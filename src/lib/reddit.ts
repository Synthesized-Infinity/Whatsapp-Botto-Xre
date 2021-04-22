import { getRandomPost } from 'redditit'
import Utils from '../Utils'
import responses from './responses.json'

export const reddit = async (subreddit: string): Promise<{ body: Buffer | string, caption?: string, nsfw?: boolean}> => {
    if (!subreddit) return { body: responses['wrong-format']}
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const post = await getRandomPost(encodeURI(subreddit)) as any
    if (!post.url) return { body: post.error as string }
    return { body: await Utils.download(post.url), caption: `Title: ${post.title}\nAuthor: ${post.author}\nPost: ${post.postLink}`}
}