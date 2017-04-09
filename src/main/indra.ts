import 'reflect-metadata'
import {Observable} from 'rxjs/Rx'
import {Injector, Inject} from 'ts-di/dist'
import {ArbitrageModule} from './arbitrage'
import {createLogger} from 'bunyan'
import {ExchangeModule} from './exchange'
import {Config} from './config'
import {ConnectionManager} from 'typeorm'
import * as path from 'path'

const injector = new Injector()
const logger = createLogger({name: "indra"})

@Inject(Config, ConnectionManager, ArbitrageModule, ExchangeModule)
class Indra {

    constructor(
        private config: Config,
        private connectionManager: ConnectionManager,
        private arbitrageModule: ArbitrageModule,
        private exchangeModule: ExchangeModule
    ) {}

    public init(): Observable<{}> {
        return Observable.fromPromise(this.connectionManager.createAndConnect({
            driver: {
                type: "mysql",
                host: this.config.mysqlHost,
                port: this.config.mysqlPort,
                username: this.config.mysqlUser,
                password: this.config.mysqlPassword,
                database: this.config.mysqlDatabase
            },
            entities: [path.join(__dirname, "**/*-entity.js")],
            autoSchemaSync: true
        }))
            .do(connection => logger.info(connection.driver.options.type + " connected"))
            .flatMap(Void => Observable.from([
                this.arbitrageModule,
                this.exchangeModule
            ]))
            .do(module => logger.info(module.constructor.name + " init"))
            .flatMap(module => module.init())
    }
}

injector.get(Indra)
    .init()
    .subscribe(Void => {}, err => logger.error(err))
