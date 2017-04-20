import 'reflect-metadata'
import {KrakenExchange, TradePair, Currency, ExchangeOrder} from './../../../main'
import {Injector} from 'ts-di/dist'
import {BigNumber} from 'bignumber.js'
import {createLogger} from 'bunyan'
import {Observable} from 'rxjs/Rx'

const injector = new Injector()
const logger = createLogger({name: "KrakenExchangeTest"})

let kraken = injector.get(KrakenExchange)

// kraken.getBalances()
//     .do(balance => logger.info("balances", balance))
//     .subscribe(Void => {},
//         err => logger.error(err))

// kraken.getBalance(Currency.BTC)
//     .do(balance => logger.info("balance", balance.toNumber()))
//     .subscribe(Void => {}, err => logger.error(err))

// kraken.getRate(new TradePair(Currency.BTC, Currency.ETH))
//     .do(rate => logger.info("rate", rate))
//     .subscribe(Void => {}, err => logger.error(err))

// kraken.placeOrder(new TradePair(Currency.BTC, Currency.ETH), new BigNumber(0.1), new BigNumber(1179.999))
//     .do(exchangeOrder => logger.info("exchangeOrder", exchangeOrder))
//     .subscribe(Void => {}, err => logger.error(err))

// let order = ExchangeOrder.create(KrakenExchange.name, new TradePair(Currency.USD, Currency.BTC))
// order.exchangeTxId = "OA44EQ-ZSMDA-5XZ254"
// kraken.updateExchangeOrder(order)
//     .do(exchangeOrder => logger.info("exchangeOrder", exchangeOrder))
//     .subscribe(Void => {}, err => logger.error(err))

// kraken.placeOrder(new TradePair(Currency.BTC, Currency.USD), new BigNumber(0.008), new BigNumber(1179.999))
//     .do(exchangeOrder => logger.info("placeOrder exchangeOrder", exchangeOrder))
//     .delay(3000)
//     .flatMap(exchangeOrder => kraken.updateExchangeOrder(exchangeOrder))
//     .do(exchangeOrder => logger.info("updateExchangeOrder exchangeOrder", exchangeOrder))
//     .subscribe(Void => {}, err => logger.error(err))

// kraken.getBalance(Currency.ETH)
//     .do(balance => logger.info("balance", balance.toNumber()))
//     .flatMap(balance => kraken.placeOrder(new TradePair(Currency.ETH, Currency.BTC), balance, new BigNumber(0.03694)))
//     .subscribe(Void => {}, err => logger.error(err))

// kraken.getBalance(Currency.ETH)
//     .flatMap(balance => kraken.transfer(Currency.ETH, balance, "GdaxExchange-ETH"))
//     .subscribe(Void => {}, err => logger.error(err))
