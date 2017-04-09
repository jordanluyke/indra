import {ArbOpportunity, ArbOpportunityEntity} from './model'
import {Observable} from 'rxjs/Rx'
import {createLogger} from 'bunyan'
import {Inject} from 'ts-di/dist'
import {OrmClient, Currency} from './../util'
import {BigNumber} from 'bignumber.js'

@Inject(OrmClient)
export class ArbitrageDao {
    private logger = createLogger({name: this.constructor.name})

    constructor(private orm: OrmClient) {
    }

    public getArbOpportunityById(id: string): Observable<ArbOpportunity> {
        return this.orm.getManager()
            .flatMap(manager => Observable.fromPromise(manager.findOneById(ArbOpportunityEntity, id)))
            .map(entity => {
                if(entity == null)
                    throw new Error("Invalid arb opportunity id")
                return this.entityToArbOpportunity(entity)
            })
    }

    public saveArbitrageOpportunity(arbOpportunity: ArbOpportunity): Observable<ArbOpportunity> {
        let entity = this.arbOpportunityToEntity(arbOpportunity)
        return this.orm.getManager()
            .flatMap(manager => Observable.fromPromise(manager.persist(entity)))
            .map(entity => this.entityToArbOpportunity(entity))
    }

    private arbOpportunityToEntity(arbOpportunity: ArbOpportunity): ArbOpportunityEntity {
        let entity = new ArbOpportunityEntity()
        entity.id = arbOpportunity.id
        entity.createdAt = arbOpportunity.createdAt.getTime()
        entity.sourceExchange = arbOpportunity.sourceExchange
        entity.destExchange = arbOpportunity.destExchange
        entity.fromCurrency = arbOpportunity.fromCurrency.toString()
        entity.toCurrency = arbOpportunity.toCurrency.toString()
        entity.sourceRate = arbOpportunity.sourceRate.round(8).toNumber()
        entity.destRate = arbOpportunity.destRate.round(8).toNumber()
        entity.percentage = arbOpportunity.percentage.round(8).toNumber()
        return entity
    }

    private entityToArbOpportunity(entity: ArbOpportunityEntity): ArbOpportunity {
        return new ArbOpportunity(
            entity.id,
            new Date(entity.createdAt),
            entity.sourceExchange,
            entity.destExchange,
            Currency[entity.fromCurrency],
            Currency[entity.toCurrency],
            new BigNumber(entity.sourceRate),
            new BigNumber(entity.destRate),
            new BigNumber(entity.percentage)
        )
    }
}
