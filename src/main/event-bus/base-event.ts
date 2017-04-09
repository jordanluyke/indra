import {RandomUtil} from './../util'

export abstract class BaseEvent {

    public id: string = RandomUtil.generateId()
    public causedAt: Date = new Date()

    constructor(public message: string) {
    }
}
