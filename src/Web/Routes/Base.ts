import chalk from 'chalk'
import { Router } from 'express'
import Client from '../../Client'
import { Web } from '../Web'
import endpoints from '../../lib/endpoints.json'
export class BaseRoutes {


    router = Router()

    constructor(public client: Client, public web: Web) {
        this.web.app.use('/', this.router)
    }

    async start() {
        this.router.get('/', (req, res) => {
            console.log(chalk.yellow('[WEB]', req.url))
            res.json({ message: 'Hi there' })
        })

        this.router.get('/endpoints', (req, res) => {
            res.json(endpoints)
        })
    
        this.router.get('/config', (req, res) => {
            console.log(chalk.yellow('[WEB]', req.url))
            res.json(this.client._config)
        })
        
        this.router.get('/user', (req, res) => {
            console.log(chalk.yellow('[WEB]', req.url))
            const json = (req.query.jid) ? (this.client.contacts[String(req.query.jid)] || {}) : this.client.user
            res.json(json)
        })

        this.router.get('/client', async (req, res) => {
            console.log(chalk.yellow('[WEB]', req.url))
            const query = req.query
            if (query?.state === this.connectionOptions[1]) {
                if (this.client.state === 'close') return res.json({ message: 'The client is not connected to WhatsApp'})
                this.client.close()
                return res.json({ message: 'WhatsApp Connection Has Been Closed', connect: `${req.url.replace(this.connectionOptions[1], this.connectionOptions[0])}`})
            } else if (query?.state === this.connectionOptions[0]){
                if (this.client.state === 'open') return res.json({ message: 'The client is already connected to WhatsApp'})
                await this.client.connect()
                return res.json({ message: 'Successfully Connected to Whatsapp'})
            }
            return res.json({ message: 'Invalid Query'})
            
        })

    }
    
    connectionOptions = ['on', 'off']

}