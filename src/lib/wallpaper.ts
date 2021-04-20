import { MessageType } from '@adiwajshing/baileys'
import { AnimeWallpaper } from 'anime-wallpaper'
import { IReply } from '../Typings'
import Utils from '../Utils'
import responses from './responses.json'
const wallClient = new AnimeWallpaper()

const alphacoders = async (term: string): Promise<Buffer | null> => {
    try {
        return Utils.download((await wallClient.getAnimeWall1({ search: term, page: 1 }))[0].image)
    } catch (err) {
        return null
    }
}

const wallpapercave = async (term: string): Promise<Buffer | null> => {
    try {
        return Utils.download((await wallClient.getAnimeWall2(term))[0].image)
    } catch (err) {
        return null
    }
}
export const wallpaper = async (term: string): Promise<IReply> => {
    if (!term) return { body: responses['wrong-format'] }
    const alpha = await alphacoders(term)
    if (alpha) return { body: alpha, type: MessageType.image }
    const cave = await wallpapercave(term)
    if (cave) return { body: cave, type: MessageType.image }
    return { body: responses['no-search-results'].replace('{T}', term) }
}
