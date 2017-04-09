import {ExchangeOrder, ExchangeOrderEntity} from './model'
import {Observable} from 'rxjs/Rx'
import {createLogger} from 'bunyan'
import {Inject} from 'ts-di/dist'
import {OrmClient, Currency} from './../util'
import {BigNumber} from 'bignumber.js'
import {ObjectLiteral} from 'typeorm'

@Inject(OrmClient)
export class ExchangeDao {
    private logger = createLogger({name: this.constructor.name})

    constructor(private orm: OrmClient) {
    }

    public getExchangeOrderById(id: string): Observable<ExchangeOrder> {
        return this.getExchangeOrderByConditions({
            id: id
        })
    }

    public getExchangeOrdersByStatus(status: ExchangeOrder.Status): Observable<ExchangeOrder> {
        return this.getExchangeOrdersByConditions({
            status: status.toString()
        })
    }

    public getExchangeOrdersByArbOpportunityId(id: string): Observable<ExchangeOrder> {
        return this.getExchangeOrdersByConditions({
            arbOpportunityId: id
        })
    }

    public saveExchangeOrder(exchangeOrder: ExchangeOrder): Observable<ExchangeOrder> {
        let entity = this.exchangeOrderToEntity(exchangeOrder)
        return this.orm.getManager()
            .flatMap(manager => Observable.fromPromise(manager.persist(entity)))
            .map(entity => this.entityToExchangeOrder(entity))
    }

    private getExchangeOrdersByConditions(conditions: ObjectLiteral): Observable<ExchangeOrder> {
        return this.orm.getManager()
            .flatMap(manager => Observable.fromPromise(manager.find(ExchangeOrderEntity, conditions)))
            .flatMap(entities => Observable.from(entities))
            .map(entity => this.entityToExchangeOrder(entity))
    }

    private getExchangeOrderByConditions(conditions: ObjectLiteral): Observable<ExchangeOrder> {
        return this.orm.getManager()
            .flatMap(manager => Observable.fromPromise(manager.findOne(ExchangeOrderEntity, conditions)))
            .map(entity => {
                if(entity == null)
                    throw new Error("Exchange order not found")
                return this.entityToExchangeOrder(entity)
            })
    }

    private entityToExchangeOrder(entity: ExchangeOrderEntity): ExchangeOrder {
        let exchangeOrder = new ExchangeOrder(entity.id, new Date(entity.createdAt), entity.exchange, Currency[entity.sourceCurrency], Currency[entity.destCurrency])
        exchangeOrder.status = ExchangeOrder.Status[entity.status]
        exchangeOrder.exchangeTxId = entity.exchangeTxId
        exchangeOrder.arbOpportunityId = entity.arbOpportunityId
        if(entity.sourceAmount != null)
            exchangeOrder.sourceAmount = new BigNumber(entity.sourceAmount)
        if(entity.destAmount != null)
            exchangeOrder.destAmount = new BigNumber(entity.destAmount)
        if(entity.rate != null)
            exchangeOrder.rate = new BigNumber(entity.rate)
        if(entity.fees != null)
            exchangeOrder.fees = new BigNumber(entity.fees)
        if(entity.feesCurrency != null)
            exchangeOrder.feesCurrency = Currency[entity.feesCurrency]
        if(entity.achievedSourceAmount != null)
            exchangeOrder.achievedSourceAmount = new BigNumber(entity.achievedSourceAmount)
        if(entity.achievedDestAmount != null)
            exchangeOrder.achievedDestAmount = new BigNumber(entity.achievedDestAmount)
        if(entity.achievedRate != null)
            exchangeOrder.achievedRate = new BigNumber(entity.achievedRate)
        return exchangeOrder
    }

    private exchangeOrderToEntity(exchangeOrder: ExchangeOrder): ExchangeOrderEntity {
        let entity = new ExchangeOrderEntity()
        entity.id = exchangeOrder.id
        entity.createdAt = exchangeOrder.createdAt.getTime()
        entity.status = exchangeOrder.status.toString()
        entity.exchange = exchangeOrder.exchange
        entity.sourceCurrency = exchangeOrder.sourceCurrency.toString()
        entity.destCurrency = exchangeOrder.destCurrency.toString()
        entity.exchangeTxId = exchangeOrder.exchangeTxId
        entity.arbOpportunityId = exchangeOrder.arbOpportunityId
        if(exchangeOrder.sourceAmount != null)
            entity.sourceAmount = exchangeOrder.sourceAmount.round(8).toNumber()
        if(exchangeOrder.destAmount != null)
            entity.destAmount = exchangeOrder.destAmount.round(8).toNumber()
        if(exchangeOrder.rate != null)
            entity.rate = exchangeOrder.rate.round(8).toNumber()
        if(exchangeOrder.fees != null)
            entity.fees = exchangeOrder.fees.round(8).toNumber()
        if(exchangeOrder.feesCurrency != null)
            entity.feesCurrency = exchangeOrder.feesCurrency.toString()
        if(exchangeOrder.achievedSourceAmount != null)
            entity.achievedSourceAmount = exchangeOrder.achievedSourceAmount.round(8).toNumber()
        if(exchangeOrder.achievedDestAmount != null)
            entity.achievedDestAmount = exchangeOrder.achievedDestAmount.round(8).toNumber()
        if(exchangeOrder.achievedRate != null)
            entity.achievedRate = exchangeOrder.achievedRate.round(8).toNumber()
        return entity
    }
}
