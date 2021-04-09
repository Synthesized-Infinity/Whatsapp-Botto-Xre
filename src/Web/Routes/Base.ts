import chalk from 'chalk'
import { Router, Request } from 'express'
import Client from '../../Client'
import { Web } from '../Web'
import endpoints from '../../lib/endpoints.json'
import moment from 'moment-timezone'
import { unlinkSync } from 'fs-extra'
export class BaseRoutes {
    router = Router()

    constructor(public client: Client, public web: Web) {
        this.web.app.use((req, res, next) => {
            const auth = this.auth(req)
            const t = typeof auth === 'boolean'
            console.log(
                chalk[!t ? 'red' : 'green']('[WEB]'),
                chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
                req.url
            )
            if (!t) return res.json(auth)
            next()
        })
        this.web.app.use('/', this.router)
    }

    async start(): Promise<void> {
        this.router.get('/', (req, res) => {
            res.json({ message: 'Hi there' })
        })
        this.router.get('/qr', (req, res) => {
            if (!this.web.QR) {
                if (this.client.state === 'open') return res.json({ message: `You're already authenticated` })
                return res.json({ message: `QR code is not generated Yet` })
            }
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': this.web.QR.length
            })
            res.end(this.web.QR)
        })

        this.router.get('/state', (req, res) => {
            res.json({ state: this.client.state })
        })
        this.router.get('/endpoints', (req, res) => {
            res.json(endpoints)
        })

        this.router.get('/config', (req, res) => {
            res.json(this.client._config)
        })

        this.router.get('/user', (req, res) => {
            const json = req.query.jid ? this.client.contacts[String(req.query.jid)] || {} : this.client.user
            res.json(json)
        })

        this.router.get('/client', async (req, res) => {
            const query = req.query
            if (query?.state === this.connectionOptions[1]) {
                if (this.client.state === 'close')
                    return res.json({
                        message: 'The client is not connected to WhatsApp'
                    })
                this.client.close()
                return res.json({
                    message: 'WhatsApp Connection Has Been Closed',
                    connect: `${req.url.replace(this.connectionOptions[1], this.connectionOptions[0])}`
                })
            } else if (query?.state === this.connectionOptions[0]) {
                if (this.client.state === 'open')
                    return res.json({
                        message: 'The client is already connected to WhatsApp'
                    })
                await this.client.connect()
                return res.json({
                    message: 'Successfully Connected to Whatsapp'
                })
            }
            return res.json({ message: 'Invalid Query' })
        })

        this.router.get('/session', async (req, res) => {
            if (req.query.delete) {
                const ID = process.env.SESSION_ID || 'PROD'
                await this.client.SessionModel.deleteOne({ ID })
                unlinkSync(`./${ID}_session.json`)
                return res.json({ message: 'Session Deleted' })
            }
            return res.json(this.client.base64EncodedAuthInfo())
        })

        this.router.get('/pfp', async (req, res) => {
            const auth = this.auth(req)
            if (typeof auth === 'object') return res.json(auth)
            if (!req.query.id) return res.json({ message: 'Not Found' })
            return res.json({ pfp: await this.client.getPfp(req.query.id as string) })
        })

        this.router.get('/wakemydyno.txt', async (req, res) => {
            res.setHeader('Content-disposition', 'attachment; filename=wakemydyno.txt')
            res.setHeader('Content-type', 'text/plain')
            res.charset = 'UTF-8'
            res.send(
                'Oneechan This Endpoint Is Not For You (づ｡◕‿‿◕｡)づ.  This is for http://wakemydyno.com/ to ping me'
            )
        })
    }

    auth = (req: Request): true | { error: string } => {
        const { query } = req
        if (!query.session) return { error: `Session ID not Provided` }
        if ((query.session as string) !== (process.env.SESSION_ID || 'PROD')) return { error: `Session ID is invalid` }
        return true
    }

    connectionOptions = ['on', 'off']
}
