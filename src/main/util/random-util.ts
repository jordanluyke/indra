import * as crypto from 'crypto'

export class RandomUtil {

    public static generateId(): string {
        return crypto.randomBytes(20).toString('hex').substr(0, 15)
    }
}
