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
    }
})

export const user = model<IUserModel>('users', UserSchema)
export interface IUserModel extends IUser, Document {}
export interface IUser {
    jid: string
    ban: boolean
}
