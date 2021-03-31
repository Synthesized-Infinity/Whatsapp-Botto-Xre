import { model, Schema } from 'mongoose'

const GroupSchema = new Schema({
    jid: {
        type: String,
        required: true,
        unique: true
    },
    events: {
        type: Boolean,
        required: false,
        unique: true
    }
})

export const group = model('groups', GroupSchema)
