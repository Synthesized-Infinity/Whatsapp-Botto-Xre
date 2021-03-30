import axios, { AxiosRequestConfig } from "axios";
import { getWById, wSearch } from "./anime";
import CreateSticker from './sticker'
export default class Utils{

    static fetch = async (url: string, options: AxiosRequestConfig) => (await axios.get(url, options)).data

    static download = async (url: string) => await Utils.fetch(url, { responseType: 'arraybuffer'})

    static randomNumber = (min: number, max: number) => Math.floor(Math.random() * max) + min

    static capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`

    static createSticker = CreateSticker

    static getAMCById = getWById
     
    static searchAMC = wSearch
}