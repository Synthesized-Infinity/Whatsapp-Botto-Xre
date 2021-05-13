import chalk from 'chalk'
import { Router, Request, urlencoded } from 'express'
import { Client } from '../../Client'
import { Web } from '../Web'
import endpoints from '../../lib/endpoints.json'
import moment from 'moment-timezone'
import { unlinkSync } from 'fs-extra'
export class BaseRoutes {
    clientRouter = Router()

    constructor(public client: Client, public web: Web) {
        this.web.app.use('/client', this.clientRouter)
        this.web.app.use('/', urlencoded({ extended: false }))
        this.web.app.set('view-engine', 'ejs')

        this.web.app.post('/auth', (req, res) => {
            if (req.body.auth !== process.env.SESSION_ID)
                return res.render('index.ejs', { error: 'Incorrect Session ID', name: this.client._config.name })
            res.redirect(`/client/qr?session=${process.env.SESSION_ID}`)
        })

        this.web.app.get('/', (req, res) => res.render('index.ejs', { name: this.client._config.name }))

        this.web.app.get('/wakemydyno.txt', async (req, res) => {
            res.setHeader('Content-disposition', 'attachment; filename=wakemydyno.txt')
            res.setHeader('Content-type', 'text/plain')
            res.charset = 'UTF-8'
            res.send(
                'Oneechan This Endpoint Is Not For You (づ｡◕‿‿◕｡)づ.  This is for http://wakemydyno.com/ to ping me'
            )
        })
        this.clientRouter.use((req, res, next) => {
            const auth = this.auth(req)
            const t = typeof auth === 'boolean'
            console.log(
                chalk[!t ? 'red' : 'green']('[WEB]'),
                chalk.blue(moment(Date.now() * 1000).format('DD/MM HH:mm:ss')),
                req.url
            )
            if (!t) return res.json(auth)
            next()
            this.clientRouter.get('/', (req, res) => {
                res.json({ message: 'Hi there' })
            })
            this.clientRouter.get('/qr', async (req, res) => {
                if (!this.web.QR) {
                    if (this.client.state === 'open') return res.json({ message: `You're already authenticated` })
                    return res.json({ message: `QR code is not generated Yet` })
                }
                res.contentType('image/png')
                return res.send(this.web.QR)
            })

            this.clientRouter.get('/state', (req, res) => {
                res.json({ state: this.client.state })
            })
            this.web.app.get('/endpoints', (req, res) => {
                res.json(endpoints)
            })

            this.clientRouter.get('/config', (req, res) => {
                res.json(this.client._config)
            })

            this.clientRouter.get('/user', (req, res) => {
                const json = req.query.jid ? this.client.contacts[String(req.query.jid)] || {} : this.client.user
                res.json(json)
            })

            this.clientRouter.get('/wa', async (req, res) => {
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
                        message: 'Successfully Connected to WhatsApp'
                    })
                }
                return res.json({ message: 'Invalid Query' })
            })

            this.clientRouter.get('/session', async (req, res) => {
                if (req.query.delete) {
                    const ID = process.env.SESSION_ID || 'PROD'
                    await this.client.SessionModel.deleteOne({ ID })
                    unlinkSync(`./${ID}_session.json`)
                    return res.json({ message: 'Session Deleted' })
                }
                return res.json(this.client.base64EncodedAuthInfo())
            })

            this.clientRouter.get('/pfp', async (req, res) => {
                const auth = this.auth(req)
                if (typeof auth === 'object') return res.json(auth)
                if (!req.query.id) return res.json({ message: 'Not Found' })
                return res.json({ pfp: await this.client.getPfp(req.query.id as string) })
            })
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
