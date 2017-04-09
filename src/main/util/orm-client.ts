import {ConnectionManager, EntityManager} from 'typeorm'
import {Inject} from 'ts-di/dist'
import {Observable} from 'rxjs/Rx'

@Inject(ConnectionManager)
export class OrmClient {

    private entityManager?: EntityManager

    constructor(private connectionManager: ConnectionManager) {
    }

    public getManager(): Observable<EntityManager> {
        return Observable.of(null)
            .flatMap(Void => {
                if(this.connectionManager.get() == null)
                    return Observable.throw("Not connected")
                return Observable.of(this.connectionManager.get().entityManager)
            })
    }
}
