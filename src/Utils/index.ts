import axios, { AxiosRequestConfig } from 'axios'
import { getWById, wSearch } from './anime'
import CreateSticker from './sticker'
import Embed from './Embed'
export default class Utils {
    static fetch = async (url: string, options: AxiosRequestConfig): Promise<Buffer | res> =>
        (await axios.get(url, options)).data

    static download = async (url: string): Promise<Buffer> =>
        (await Utils.fetch(url, { responseType: 'arraybuffer' })) as Buffer

    static randomNumber = (min: number, max: number): number => Math.floor(Math.random() * max) + min

    static capitalize = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

    static createSticker = CreateSticker

    static getAMCById = getWById

    static searchAMC = wSearch

    static Embed = Embed

    static emojies = ['📗', '👑', '⚓', '〽', '⭕', '⏳']
}

export interface res {
    [pro: string]: string | string[]
}
