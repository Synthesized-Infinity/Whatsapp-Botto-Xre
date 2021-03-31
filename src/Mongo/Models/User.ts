import { Document, Schema, model } from 'mongoose'

const UserSchema = new Schema({
    jid: {
        type: String,
        required: true,
        unique: true
    },
    ban: {
        type: Boolean,
        required: true,
        default: false
    },
    warnings: {
        type: Number,
        required: true,
        default: 0
    }
})

export const user = model<IUserModel>('users', UserSchema)
export interface IUserModel extends IUser, Document {}
export interface IUser {
    jid: string
    ban: boolean
    warnings: number
}
