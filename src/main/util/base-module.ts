import {Observable, Subscription} from 'rxjs/Rx'
import {createLogger} from 'bunyan'

export abstract class BaseModule {

    protected logger = createLogger({name: this.constructor.name})
    protected subscriptions: Subscription[] = []

    abstract init(): void

    protected subscribeForever(o: Observable<any>, delay: number): void {
        let subscription = Observable.of(null)
            .expand(Void => o.delay(delay)
                .retryWhen(errors => errors
                    .do(err => this.logger.error(err))
                    .delay(delay))
                .defaultIfEmpty(null))
            .subscribe()
        this.subscriptions.push(subscription)
    }
}
