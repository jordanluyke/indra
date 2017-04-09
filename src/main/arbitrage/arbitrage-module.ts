import {BaseModule} from './../util'
import {Inject} from 'ts-di/dist'
import {ArbitrageProcessor} from './arbitrage-processor'
import {Observable} from 'rxjs/Rx'
import {EventBus} from './../event-bus'
import {ArbOpportunityCreatedEvent} from './events'
import {ExchangeOrderFilledEvent} from './../exchange'
import {ArbitrageManager} from './arbitrage-manager'

@Inject(ArbitrageProcessor, EventBus, ArbitrageManager)
export class ArbitrageModule extends BaseModule {

    constructor(
        private arbitrageProcessor: ArbitrageProcessor,
        private eventBus: EventBus,
        private arbitrageManager: ArbitrageManager
    ) {
        super()
    }

    public init(): Observable<{}> {
        this.eventBus.addSubscription(ArbOpportunityCreatedEvent, o => o
            .flatMap(event => this.arbitrageProcessor.process(event.arbOpportunity)))

        this.eventBus.addSubscription(ExchangeOrderFilledEvent, o => o
            .flatMap(event => this.arbitrageProcessor.makeTransfer(event.exchangeOrder)))

        this.subscribeForever(this.arbitrageProcessor.findArbitrageOpportunities(), 3000)

        return Observable.empty()
    }
}
