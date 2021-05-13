import responses from './responses.json'
import Utils from '../Utils'
export const lyrics = async (term: string): Promise<string> => {
    if (!process.env.EIF) return responses.warnings.EIF
    if (!term) responses['empty-query']
    const data = await Utils.fetch(`${process.env.EIF}/lyrics?term=${encodeURI(term)}`, {})
    return data.status !== 200
        ? data.error
        : responses.lyrics.replace(`{T}`, Utils.capitalize(data.term)).replace(`{L}`, data.lyrics)
}
