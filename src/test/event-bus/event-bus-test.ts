import 'reflect-metadata'
import {Observable, Observer, Subject, Subscription} from 'rxjs/Rx'
// import {BaseEvent} from './base-event'
// import {Multimap, ArrayListMultimap} from './../util'
import {createLogger} from 'bunyan'
import {Injector} from 'ts-di/dist'
import {EventBus, ExchangeOrderFilledEvent, ExchangeOrder, TradePair, Currency} from './../../main'

const injector = new Injector()
const logger = createLogger({name: "EventBusTest"})

let eventBus = new EventBus()

eventBus.addSubscription(ExchangeOrderFilledEvent, o => o
    .flatMap(event => {
        logger.info(event)
        return Observable.empty()
    }))

eventBus.publish(new ExchangeOrderFilledEvent(ExchangeOrder.create(
    "JacobsMomExchange",
    new TradePair(Currency.BTC, Currency.USD)
)))

eventBus.publish(new ExchangeOrderFilledEvent(ExchangeOrder.create(
    "JacobsMomExchange",
    new TradePair(Currency.BTC, Currency.USD)
)))

eventBus.publish(new ExchangeOrderFilledEvent(ExchangeOrder.create(
    "JacobsMomExchange",
    new TradePair(Currency.BTC, Currency.USD)
)))
