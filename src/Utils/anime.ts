import { MessageType } from '@adiwajshing/baileys'
import axios from 'axios'
import responses from '../lib/responses.json'
import Utils from '.'


export const getWById = async (id: string, type: 'anime' | 'manga' | 'character' = 'character') => {4
    if (!id) return { body: responses["empty-query"] }
    try {
        const r = await Utils.fetch(`https://api.jikan.moe/v3/${type}/${id}`, {}) 
        let sim = r
        const n = (type !== 'character') ? r.score : (sim.animeography[0]) ? (sim.animeography[0]['name']) : sim.mangaography[0].name
        let dt = `📙 *${(type === 'anime' || type === 'manga') ? 'Title' : 'Name' }:* ${sim[(type === 'manga' || type === 'anime') ? 'title' : 'name']}\n\n🔖 *ID:* ${sim.mal_id}\n\n☄ *${(type === 'anime' || type === 'manga') ?'Rating' : 'Series'}: ${n}*\n\n❄️ ${(type === 'anime' || type === 'manga') ? `*Synopsis:* ${sim.synopsis.replace(/\\n/g, '')}` : `*About:* ${sim.About.replace(/\\n/g, '')}`}\n\n🌐 *URL:* ${sim.url}`
        return { caption: dt, body: await Utils.download(sim.image_url), type: MessageType.image }
    } catch(err) {
        return { body: `Couldn't find *${id}*` }
    }
}

export const wSearch = async (q: string, preifx: string, type: 'anime' | 'manga' | 'character' = 'character') => {
    if (!q) return { body: responses["empty-query"] }
    try {
        const res = await Utils.fetch(`https://api.jikan.moe/v3/search/${type}?q=${q}`, {})
        let z = `🎋 *${type}* 🎋\n\n`
        let sim = res.results
        let n = 10
        if (sim.length < 10) n = sim.length
        for (let i = 0; i < n; i++) {
            z += `📗 *${(type === 'anime' || type === 'manga') ? `Title:* ${sim[i].title}` : `Name:* ${sim[i].name}`}:\n🌐 Url:* ${sim[i].url}\n🎀 *Full Info:* ${preifx}${(type === 'anime') ? 'aid' : (type === 'manga') ? 'mid' : 'chid' } ${sim[i].mal_id}\n\n`
        }
        return { caption: z, body: await Utils.download(sim[0].image_url), type: MessageType.image } 
    } catch(err) {
        return { body: 'Couldn\'t find' }
    }
}