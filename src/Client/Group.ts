import { GroupEx } from '../lib'
import { IGroupInfo } from '../Typings'
import { Client as Base } from './ML'

export class Client extends Base {
    group = new GroupEx(this)

    async getGroupInfo(jid: string): Promise<IGroupInfo> {
        const metadata = await this.groupMetadata(jid)
        const admins: string[] = []
        metadata.participants.forEach((user) => (user.isAdmin ? admins.push(user.jid) : ''))
        let data = await this.GroupModel.findOne({ jid })
        if (!data) data = await new this.GroupModel({ jid }).save()
        return { metadata, admins, data }
    }
}
