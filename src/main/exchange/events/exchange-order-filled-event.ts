import {BaseEvent} from './../../event-bus'
import {ExchangeOrder} from './../model'

export class ExchangeOrderFilledEvent extends BaseEvent {

    constructor(public exchangeOrder: ExchangeOrder) {
        super("Exchange order filled " + exchangeOrder.id)
    }
}
