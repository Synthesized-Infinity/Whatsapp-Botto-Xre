import { model, Schema, Document } from 'mongoose'

const GroupSchema = new Schema({
    jid: {
        type: String,
        required: true,
        unique: true
    },
    events: {
        type: Boolean,
        required: false,
        default: false
    },
    nsfw: {
        type: Boolean,
        required: false,
        default: false
    }
})

export const group = model<IGroupModel>('groups', GroupSchema)

export interface IGroupModel extends IGroup, Document {}
export interface IGroup {
    jid: string
    events: boolean
    nsfw: boolean
}
