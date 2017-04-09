import {BigNumber} from 'bignumber.js'
import {RandomUtil, Currency} from './../../util'
import {TradePair} from './trade-pair'

export class ExchangeOrder {

    public id: string
    public createdAt: Date
    public status = ExchangeOrder.Status.NEW
    public exchange: string
    public sourceCurrency: Currency
    public destCurrency: Currency
    public exchangeTxId?: string
    public arbOpportunityId?: string
    public sourceAmount?: BigNumber
    public destAmount?: BigNumber
    public rate?: BigNumber
    public fees?: BigNumber
    public feesCurrency?: Currency
    public achievedSourceAmount?: BigNumber
    public achievedDestAmount?: BigNumber
    public achievedRate?: BigNumber

    constructor(id: string, createdAt: Date, exchange: string, sourceCurrency: Currency, destCurrency: Currency) {
        this.id = id
        this.createdAt = createdAt
        this.exchange = exchange
        this.sourceCurrency = sourceCurrency
        this.destCurrency = destCurrency
    }

    public static create(exchange: string, pair: TradePair): ExchangeOrder {
        return new ExchangeOrder(RandomUtil.generateId(), new Date(), exchange, pair.from, pair.to)
    }
}

export module ExchangeOrder {
    export enum Status {
        NEW = <any>"NEW",
        PLACED = <any>"PLACED",
        FILLED = <any>"FILLED",
        CANCELLED = <any>"CANCELLED",
        FAILED = <any>"FAILED"
    }
}
