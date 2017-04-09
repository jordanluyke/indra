import {ArbOpportunity} from './model'
import {Observable} from 'rxjs/Rx'

export interface ArbitrageManagerIntf {

    getArbOpportunityById(id: string): Observable<ArbOpportunity>

    saveArbOpportunity(arbOpportunity: ArbOpportunity): Observable<ArbOpportunity>
}
