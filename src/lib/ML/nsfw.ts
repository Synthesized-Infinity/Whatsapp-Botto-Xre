import * as tf from '@tensorflow/tfjs-node'
import * as nsfw from 'nsfwjs'

export class MlNsfw {
    nsfwModel!: nsfw.NSFWJS

    constructor() {
        nsfw.load().then((m) => {
            this.nsfwModel = m
        })
    }

    check = async (image: Buffer): Promise<boolean> => {
        const decodedImage = await tf.node.decodeImage(image, 3)
        const pre = await this.nsfwModel.classify(decodedImage as tf.Tensor3D)
        decodedImage.dispose()
        if (pre[0].className === 'Hentai' || pre[0].className === 'Porn') return true
        return false
    }
}
