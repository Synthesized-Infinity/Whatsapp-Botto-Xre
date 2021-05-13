import axios, { AxiosRequestConfig } from 'axios'
import Embed from './Embed'

export default class Utils {
    /* eslint-disable @typescript-eslint/no-explicit-any*/
    static fetch = async (url: string, options: AxiosRequestConfig): Promise<Buffer | any> =>
        (await axios.get(url, options)).data

    static download = async (url: string): Promise<Buffer> => await Utils.fetch(url, { responseType: 'arraybuffer' })

    static randomNumber = (min: number, max: number): number => Math.floor(Math.random() * max) + min

    static capitalize = (text: string): string => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

    static Embed = Embed

    static emojis = ['📗', '👑', '⚓', '〽', '⭕', '⏳']

    static urlRegExp = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/

    static urlMatch = (text: string): RegExpMatchArray | null => text.match(Utils.urlRegExp)
}
