import { MessageType, Mimetype } from '@adiwajshing/baileys'
import { IReply } from '../Typings'
import Utils from '../Utils'

/** Side-note
 * To get gif in other formats, I'd recommed you exploring the json itself which provided link returns.
 * This stability of the url and API_KEY is not guaranteed
 * Regards ~ Somnath Das
 */
const getGify = async (keyword: string): Promise<string | null> => {
    // Fetching gif json by providing keyword
    const data: { results: IGifyResponse[] } = await Utils.fetch(
        `https://g.tenor.com/v1/search?q=${keyword}&key=LIVDSRZULELA&limit=8`,
        {}
    )
    return data.results?.[Math.floor(Math.random() * data.results.length)]?.media[0]?.mp4?.url
}

export const getGifReply = async (query: string, users?: [string, string]): Promise<IReply> => {
    if (!query) return { body: `Please Provide the query to search for!` }
    const gif = await getGify(query)
    if (!gif) return { body: 'No GIF Found!' }
    const [body, type, mime] = [await Utils.download(gif), MessageType.video, Mimetype.gif]
    return {
        body,
        type,
        mime,
        caption: !users ? `*Query: ${query}*` : `${users[0]} _${Utils.capitalize(query)}ed_ ${users[1]}`
    }
}

interface IGifyResponse {
    media: {
        mp4: {
            url: string
        }
    }[]
}
