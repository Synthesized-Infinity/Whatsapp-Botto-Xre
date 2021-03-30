import chalk from 'chalk'
import { Router } from 'express'
import Client from '../../Client'
import { Web } from '../Web'

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
    
        this.router.get('/config', (req, res) => {
            console.log(chalk.yellow('[WEB]', req.url))
            res.json(this.client._config)
        })
        
        this.router.get('/user', (req, res) => {
            console.log(chalk.yellow('[WEB]', req.url))
            const json = (req.query.jid) ? (this.client.contacts[String(req.query.jid)] || {}) : this.client.user
            res.json(json)
        })

    }

}