import {Observable, Observer, Subject, Subscription} from 'rxjs/Rx'
import {BaseEvent} from './base-event'
import {Multimap, ArrayListMultimap} from './../util'
import {createLogger} from 'bunyan'

export class EventBus {
    private logger = createLogger({name: this.constructor.name})
    private subscribers: Multimap<string, Observer<any>> = ArrayListMultimap.create()

    public addSubscription<T>(event: ClassInterface<T>, handler: (o: Observable<T>) => Observable<any>): void {
        handler(Observable.create((observer: Observer<T>) => {
            this.subscribers.put(event.name, observer)
        }))
            .subscribe(Void => {}, err => this.logger.error(err))
    }

    public publish(event: BaseEvent): void {
        this.logger.info(event.constructor.name, event.message)
        Observable.from(this.subscribers.get(event.constructor.name))
            .do(subscriber => subscriber.next(event))
            .toArray()
            .subscribe(Void => {}, err => this.logger.error(err))
    }
}

interface ClassInterface<T> {
    new (...params: any[]): T
}
