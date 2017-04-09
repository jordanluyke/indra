import {BaseModule} from './../util'
import {Inject} from 'ts-di/dist'
import {Observable} from 'rxjs/Rx'
import {ExchangeManager} from './exchange-manager'

@Inject(ExchangeManager)
export class ExchangeModule extends BaseModule {

    constructor(private exchangeManager: ExchangeManager) {
        super()
    }

    public init(): Observable<{}> {
        this.subscribeForever(this.exchangeManager.updatePlacedOrders(), 5000)

        return Observable.empty()
    }
}
