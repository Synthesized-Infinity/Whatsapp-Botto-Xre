import { model, Schema } from 'mongoose'
import { IGroupModel } from '../../Typings'

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
    },
    safe: {
        type: Boolean,
        required: false,
        default: false
    },
    mod: {
        type: Boolean,
        required: false,
        default: false
    }
})

export const group = model<IGroupModel>('groups', GroupSchema)
