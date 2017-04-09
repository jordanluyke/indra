import {BigNumber} from 'bignumber.js'
import {TradePair, ExchangeRate, ExchangeOrder} from './../model'
import {Currency} from './../../util'
import {Observable} from 'rxjs/Rx'

export abstract class Exchange {

    abstract getRate(tradePair: TradePair): Observable<ExchangeRate>

    abstract getSupportedTradeDirections(): TradePair[]

    abstract getDepositAddress(currency: Currency): string

    abstract getBalances(): Observable<Map<Currency, BigNumber>>

    abstract getBalance(currency: Currency): Observable<BigNumber>

    /**
     * Places market order on exchange
     *
     * @param pair asset currency and cost currency
     * @param quantity asset quantity, or source quantity
     * @returns new exchange order
     */
    abstract placeOrder(pair: TradePair, quantity: BigNumber, rate: BigNumber): Observable<ExchangeOrder>

    abstract updateExchangeOrder(exchangeOrder: ExchangeOrder): Observable<ExchangeOrder>

    abstract transfer(currency: Currency, quantity: BigNumber, destination: string): Observable<{}>
}
