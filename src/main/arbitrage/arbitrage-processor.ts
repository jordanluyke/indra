import {Observable, Observer} from 'rxjs/Rx'
import {Inject} from 'ts-di/dist'
import {Currency, RandomUtil} from './../util'
import {TradePair, ExchangeManager, ExchangeOrder, KrakenExchange} from './../exchange'
import {createLogger} from 'bunyan'
import {ArbOpportunity} from './model'
import {BigNumber} from 'bignumber.js'
import {Config} from './../config'
import {EventBus} from './../event-bus'
import {ArbOpportunityCreatedEvent} from './events'
import {ArbitrageManager} from './arbitrage-manager'

@Inject(ExchangeManager, Config, EventBus, ArbitrageManager)
export class ArbitrageProcessor {
    private logger = createLogger({name: this.constructor.name})

    constructor(
        private exchangeManager: ExchangeManager,
        private config: Config,
        private eventBus: EventBus,
        private arbitrageManager: ArbitrageManager
    ) {}

    public process(arbOpportunity: ArbOpportunity): Observable<{}> {
        return this.exchangeManager.getExchangeOrdersByStatus(ExchangeOrder.Status.PLACED)
            .toArray()
            .filter(exchangeOrders => {
                if(exchangeOrders.length > 0) {
                    this.logger.warn("Exchange orders open, cannot process arb opportunity")
                    return false
                }
                return true
            })
            .flatMap(Void => Observable.zip(
                this.exchangeManager.getBalance(arbOpportunity.sourceExchange, arbOpportunity.fromCurrency),
                this.exchangeManager.getBalance(arbOpportunity.destExchange, arbOpportunity.toCurrency),
                (sourceExchangeBalance, destExchangeBalance) => {
                    this.logger.info("Processing arb opportunity with balances:",
                        arbOpportunity.sourceExchange, sourceExchangeBalance.toString(), arbOpportunity.fromCurrency + ",",
                        arbOpportunity.destExchange, destExchangeBalance.toString(), arbOpportunity.toCurrency)
                    let sourceMin = this.config.minimumBalances.get(arbOpportunity.fromCurrency)
                    let destMin = this.config.minimumBalances.get(arbOpportunity.toCurrency)
                    if(sourceMin == null || destMin == null)
                        throw new Error("Invalid currency")
                    if(sourceExchangeBalance.comparedTo(sourceMin) < 0 || destExchangeBalance.comparedTo(destMin) < 0) {
                        this.logger.warn("Insufficient balance")
                        return Observable.empty()
                    }
                    let sourceMaxTradeSize = this.config.maxTradeSize.get(arbOpportunity.fromCurrency)
                    let destMaxTradeSize = this.config.maxTradeSize.get(arbOpportunity.toCurrency)
                    if(sourceMaxTradeSize == null || destMaxTradeSize == null)
                        throw new Error("Max trade size not found")
                    let sourceExchangeTradeAmount = BigNumber.min(sourceExchangeBalance, sourceMaxTradeSize)
                    let destExchangeTradeAmount = BigNumber.min(sourceExchangeBalance, destMaxTradeSize)
                    return Observable.zip(
                        this.exchangeManager.placeOrder(arbOpportunity.sourceExchange, new TradePair(arbOpportunity.fromCurrency, arbOpportunity.toCurrency), sourceExchangeTradeAmount, arbOpportunity.sourceRate),
                        this.exchangeManager.placeOrder(arbOpportunity.destExchange, new TradePair(arbOpportunity.toCurrency, arbOpportunity.fromCurrency), destExchangeTradeAmount, arbOpportunity.destRate),
                        (sourceExchangeOrder, destExchangeOrder) => {
                            sourceExchangeOrder.rate = arbOpportunity.sourceRate
                            sourceExchangeOrder.sourceAmount = sourceExchangeBalance
                            sourceExchangeOrder.destAmount = sourceExchangeBalance.times(arbOpportunity.sourceRate)
                            destExchangeOrder.rate = arbOpportunity.destRate
                            destExchangeOrder.sourceAmount = destExchangeBalance
                            destExchangeOrder.destAmount = destExchangeBalance.times(arbOpportunity.destRate)
                            return Observable.of(sourceExchangeOrder, destExchangeOrder)
                                .flatMap(exchangeOrder => {
                                    exchangeOrder.arbOpportunityId = arbOpportunity.id
                                    return this.exchangeManager.saveExchangeOrder(exchangeOrder)
                                })
                                .do(exchangeOrder => this.logger.info("Exchange order created:", exchangeOrder.exchange, exchangeOrder.id))
                        }).flatMap(m=>m)
                }).flatMap(m=>m))
    }

    public findArbitrageOpportunities(): Observable<ArbOpportunity> {
        return this.exchangeManager.getExchangeRates()
            .flatMap(exchangeRates => {
                let exchangePairs: [string, string][] = []
                this.config.exchanges.map(e => e.name).forEach(sourceExchange => {
                    this.config.exchanges.map(e => e.name).forEach(destExchange => {
                        if(sourceExchange != destExchange && exchangePairs.filter(pair => sourceExchange == pair[1] && destExchange == pair[0]).length == 0)
                            exchangePairs.push([sourceExchange, destExchange])
                    })
                })
                return Observable.from(exchangePairs)
                    .flatMap(exchangePair => Observable.zip(
                        this.exchangeManager.getSupportedTradeDirections(exchangePair[0]).toArray(),
                        this.exchangeManager.getSupportedTradeDirections(exchangePair[1]).toArray(),
                        (sourceExchangeTradeDirections, destExchangeTradeDirections) => {
                            let validTradeDirections: TradePair[] = []
                            sourceExchangeTradeDirections.forEach(sourceTradePair => {
                                destExchangeTradeDirections.forEach(destTradePair => {
                                    if(sourceTradePair.equals(destTradePair.reverse()))
                                        validTradeDirections.push(sourceTradePair)
                                })
                            })
                            return Observable.from(validTradeDirections)
                        }).flatMap(m=>m)
                        .flatMap(tradeDirection => {
                            let exchangeNameRatePair: [string, BigNumber][] = exchangePair.map((exchangeName, index) => {
                                let exchangeNameRatesMap = exchangeRates.get(exchangeName)
                                if(exchangeNameRatesMap == null)
                                    throw new Error("Exchange not found")
                                let rateResult = Array.from(exchangeNameRatesMap.entries())
                                    .find(entry => (index == 0 ? tradeDirection : tradeDirection.reverse()).equals(entry[0]))
                                if(rateResult == null)
                                    throw new Error("Rate not found")
                                return <[string, BigNumber]>[exchangeName, rateResult[1]]
                            })

                            let sourceExchange = exchangeNameRatePair[0][0]
                            let destExchange = exchangeNameRatePair[1][0]
                            let sourceRate = new BigNumber(1).div(exchangeNameRatePair[0][1])
                            let destRate = exchangeNameRatePair[1][1]

                            return Observable.of(new ArbOpportunity(
                                RandomUtil.generateId(),
                                new Date(),
                                sourceExchange,
                                destExchange,
                                tradeDirection.from,
                                tradeDirection.to,
                                sourceRate,
                                destRate,
                                ArbOpportunity.getPercentage(sourceRate, destRate)))
                        })
                        .do(arbOpportunity => {
                            this.logger.info("Arbitrage rate:",
                                `${arbOpportunity.sourceExchange}(${arbOpportunity.fromCurrency}->${arbOpportunity.toCurrency})`,
                                "<->",
                                `${arbOpportunity.destExchange}(${arbOpportunity.toCurrency}->${arbOpportunity.fromCurrency})`,
                                "|",
                                arbOpportunity.percentage.toFormat(2), "%")
                        })
                        .filter(arbOpportunity => arbOpportunity.percentage.comparedTo(this.config.minExecutionPercentage) >= 0)
                        .do(arbOpportunity => this.eventBus.publish(new ArbOpportunityCreatedEvent(arbOpportunity))))
                        .flatMap(arbOpportunity => this.arbitrageManager.saveArbOpportunity(arbOpportunity))
            })
    }

    /**
     * transfers funds to paired exchange
     * @param exchangeOrder
     */
    public makeTransfer(exchangeOrder: ExchangeOrder): Observable<{}> {
        let arbOpportunityId = exchangeOrder.arbOpportunityId
        if(arbOpportunityId == null)
            throw new Error("No arbOpportunity id on exchangeOrder")
        return this.arbitrageManager.getArbOpportunityById(arbOpportunityId)
            .flatMap(arbOpportunity => {
                let pairedExchangeName = exchangeOrder.exchange == arbOpportunity.sourceExchange ? arbOpportunity.destExchange : arbOpportunity.sourceExchange
                return this.exchangeManager.getDepositAddress(pairedExchangeName, exchangeOrder.destCurrency)
                    .flatMap(depositAddress => {
                        if(exchangeOrder.exchange == null)
                            throw new Error("No exchange on exchange order")
                        if(exchangeOrder.achievedDestAmount == null)
                            throw new Error("No achievedDestAmount on exchange order")
                        if(exchangeOrder.exchange == KrakenExchange.name) // hack for kraken withdrawal fuckery
                            depositAddress = pairedExchangeName + "-" + exchangeOrder.destCurrency
                        // use balance because kraken has hidden fees in orders
                        return this.exchangeManager.getBalance(exchangeOrder.exchange, exchangeOrder.destCurrency)
                            .do(balance => this.logger.info("Transferring", balance.toString(), exchangeOrder.destCurrency, "from", exchangeOrder.exchange, "to", pairedExchangeName))
                            .flatMap(balance => this.exchangeManager.transfer(exchangeOrder.exchange, exchangeOrder.destCurrency, balance, depositAddress))
                    })
            })
    }
}
