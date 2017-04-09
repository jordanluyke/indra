import {ArbitrageManagerIntf} from './arbitrage-manager-intf'
import {ArbOpportunity} from './model'
import {BigNumber} from 'bignumber.js'
import {TradePair, KrakenExchange, ExchangeManager, ExchangeOrder} from './../exchange'
import {Currency} from './../util'
import {Observable} from 'rxjs/Rx'
import {Inject} from 'ts-di/dist'
import {ArbitrageDao} from './arbitrage-dao'

@Inject(ArbitrageDao, ExchangeManager)
export class ArbitrageManager implements ArbitrageManagerIntf {

    constructor(
        private arbitrageDao: ArbitrageDao,
        private exchangeManager: ExchangeManager
    ) {}

    public getArbOpportunityById(id: string): Observable<ArbOpportunity> {
        return this.arbitrageDao.getArbOpportunityById(id)
    }

    public saveArbOpportunity(arbOpportunity: ArbOpportunity): Observable<ArbOpportunity> {
        return this.arbitrageDao.saveArbitrageOpportunity(arbOpportunity)
    }

    // use in report generation
    // public updateAchievedArbitrage(arbOpportunityId: string): Observable<ArbOpportunity> {
    //     return this.arbitrageDao.getArbOpportunityById(arbOpportunityId)
    //         .flatMap(arbOpportunity => Observable.zip(
    //             this.exchangeManager.getExchangeOrderByExchangeAndArbOpportunityId(arbOpportunity.sourceExchange, arbOpportunity.id),
    //             this.exchangeManager.getExchangeOrderByExchangeAndArbOpportunityId(arbOpportunity.destExchange, arbOpportunity.id),
    //             (sourceExchangeOrder, destExchangeOrder) => {
    //                 if(sourceExchangeOrder.status == ExchangeOrder.Status.FILLED && destExchangeOrder.status == ExchangeOrder.Status.FILLED && sourceExchangeOrder.achievedRate != null && destExchangeOrder.achievedRate != null) {
    //                     arbOpportunity.achievedArbitrage = ArbOpportunity.getPercentage(sourceExchangeOrder.achievedRate, destExchangeOrder.achievedRate)
    //                     return this.arbitrageDao.saveArbitrageOpportunity(arbOpportunity)
    //                 }
    //                 return Observable.empty()
    //             }
    //         ).flatMap(m=>m))
    // }
}
