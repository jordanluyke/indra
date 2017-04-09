import {ExchangeOrder, TradePair} from './model'
import {Observable} from 'rxjs/Rx'
import {BigNumber} from 'bignumber.js'
import {Currency} from './../util'

export interface ExchangeManagerIntf {

    getExchangeOrderById(id: string): Observable<ExchangeOrder>

    getExchangeOrdersByStatus(status: ExchangeOrder.Status): Observable<ExchangeOrder>

    getExchangeOrdersByArbOpportunityId(id: string): Observable<ExchangeOrder>

    saveExchangeOrder(exchangeOrder: ExchangeOrder): Observable<ExchangeOrder>

    getExchangeRates(): Observable<Map<string, Map<TradePair, BigNumber>>>

    getSupportedTradeDirections(exchangeName: string): Observable<TradePair>

    getDepositAddress(exchangeName: string, currency: Currency): Observable<string>

    getBalance(exchangeName: string, currency: Currency): Observable<BigNumber>

    placeOrder(exchangeName: string, pair: TradePair, quantity: BigNumber, rate: BigNumber): Observable<ExchangeOrder>

    transfer(exchangeName: string, currency: Currency, quantity: BigNumber, destination: string): Observable<{}>

    updatePlacedOrders(): Observable<ExchangeOrder>
}
