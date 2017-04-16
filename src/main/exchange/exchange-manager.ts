import {ExchangeOrder, TradePair} from './model'
import {Observable} from 'rxjs/Rx'
import {ExchangeManagerIntf} from './exchange-manager-intf'
import {BigNumber} from 'bignumber.js'
import {Config} from './../config'
import {Inject, Injector} from 'ts-di/dist'
import {Exchange} from './markets'
import {createLogger} from 'bunyan'
import {Currency} from './../util'
import {ExchangeDao} from './exchange-dao'
import {ExchangeOrderFilledEvent} from './events'
import {EventBus} from './../event-bus'

@Inject(Config, ExchangeDao, EventBus)
export class ExchangeManager implements ExchangeManagerIntf {

    private logger = createLogger({name: this.constructor.name})
    private injector = new Injector()

    constructor(
        private config: Config,
        private exchangeDao: ExchangeDao,
        private eventBus: EventBus
    ) {}

    public getExchangeOrderById(id: string): Observable<ExchangeOrder> {
        return this.exchangeDao.getExchangeOrderById(id)
    }

    public getExchangeOrdersByStatus(status: ExchangeOrder.Status): Observable<ExchangeOrder> {
        return this.exchangeDao.getExchangeOrdersByStatus(status)
    }

    public getExchangeOrdersByArbOpportunityId(id: string): Observable<ExchangeOrder> {
        return this.exchangeDao.getExchangeOrdersByArbOpportunityId(id)
    }

    public saveExchangeOrder(exchangeOrder: ExchangeOrder): Observable<ExchangeOrder> {
        return this.exchangeDao.saveExchangeOrder(exchangeOrder)
    }

    public getExchangeRates(): Observable<Map<string, Map<TradePair, BigNumber>>> {
        return this.getExchanges()
            .flatMap(exchange => Observable.from(this.config.supportedExchangePairs)
                .flatMap(pair => exchange.getRate(pair))
                .reduce((map, rate) => map
                    .set(rate.tradePair, rate.rate)
                    .set(rate.tradePair.reverse(), rate.reverseRate), new Map<TradePair, BigNumber>())
                .map(map => [exchange.constructor.name, map]))
            .reduce((map, exchangePair: [string, Map<TradePair, BigNumber>]) => map.set(exchangePair[0], exchangePair[1]), new Map<string, Map<TradePair, BigNumber>>())
    }

    public getSupportedTradeDirections(exchange: string): Observable<TradePair> {
        return this.getExchangeByName(exchange)
            .flatMap(exchange => Observable.from(exchange.getSupportedTradeDirections()))
    }

    public getDepositAddress(exchangeName: string, currency: Currency): Observable<string> {
        return this.getExchangeByName(exchangeName)
            .map(exchange => exchange.getDepositAddress(currency))
    }

    public getBalance(exchangeName: string, currency: Currency): Observable<BigNumber> {
        return this.getExchangeByName(exchangeName)
            .flatMap(exchange => exchange.getBalance(currency))
    }

    public placeOrder(exchangeName: string, pair: TradePair, quantity: BigNumber, rate: BigNumber): Observable<ExchangeOrder> {
        return this.getExchangeByName(exchangeName)
            .flatMap(exchange => exchange.placeOrder(pair, quantity, rate))
            .flatMap(exchangeOrder => this.exchangeDao.saveExchangeOrder(exchangeOrder))
    }

    public transfer(exchangeName: string, currency: Currency, quantity: BigNumber, destination: string): Observable<{}> {
        return this.getExchangeByName(exchangeName)
            .flatMap(exchange => exchange.transfer(currency, quantity, destination))
    }

    public updatePlacedOrders(): Observable<ExchangeOrder> {
        return this.exchangeDao.getExchangeOrdersByStatus(ExchangeOrder.Status.PLACED)
            .flatMap(exchangeOrder => this.getExchangeByName(exchangeOrder.exchange)
                .flatMap(exchange => exchange.updateExchangeOrder(exchangeOrder)))
            .filter(exchangeOrder => exchangeOrder.status == ExchangeOrder.Status.FILLED)
            .flatMap(exchangeOrder => this.exchangeDao.saveExchangeOrder(exchangeOrder))
            .do(exchangeOrder => this.eventBus.publish(new ExchangeOrderFilledEvent(exchangeOrder)))
    }

    private getExchanges(): Observable<Exchange> {
        return Observable.from(this.config.exchanges.map(exchange => <Exchange>this.injector.get(exchange)))
    }

    private getExchangeByName(exchangeName: string): Observable<Exchange> {
        return this.getExchanges()
            .filter(exchange => exchangeName == exchange.constructor.name)
            .take(1)
    }
}
