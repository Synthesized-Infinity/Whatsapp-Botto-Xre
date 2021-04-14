import { MlNsfw } from '../lib'
import { Client as Base } from './Utils'

export class Client extends Base {
    ML = {
        nsfw: new MlNsfw()
    }
}
