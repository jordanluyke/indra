import 'reflect-metadata'
import {GdaxExchange, TradePair, Currency, ExchangeOrder} from './../../../main'
import {Injector} from 'ts-di/dist'
import {BigNumber} from 'bignumber.js'
import {createLogger} from 'bunyan'

const injector = new Injector()
const logger = createLogger({name: "GdaxExchangeTest"})

let gdax = injector.get(GdaxExchange)

// gdax.getBalance(Currency.ETH)
//     .do(balance => logger.info("balance", balance.toNumber()))
//     .subscribe(Void => {}, err => logger.error(err))

// gdax.getBalances()
//     .do(balances => logger.info("balances", balances))
//     .subscribe(Void => {}, err => logger.error(err))

// gdax.getRate(new TradePair(Currency.BTC, Currency.ETH))
//     .do(rate => logger.info("rate", rate))
//     .subscribe(Void => {}, err => logger.error(err))

// gdax.placeOrder(new TradePair(Currency.ETH, Currency.BTC), new BigNumber(2.1), new BigNumber(0.03694))
//     .do(exchangeOrder => logger.info("exchangeOrder", exchangeOrder))
//     .subscribe(Void => {}, err => logger.error(err))

// let order = ExchangeOrder.create(GdaxExchange.name, new TradePair(Currency.USD, Currency.BTC))
// order.exchangeTxId = "c08ac5fc-f49c-449d-ae30-525596ba4b96"
// gdax.updateExchangeOrder(order)
//     .do(exchangeOrder => logger.info("exchangeOrder", exchangeOrder))
//     .subscribe(Void => {}, err => logger.error(err))

// gdax.transfer(Currency.BTC, new BigNumber(0.0716643695326373), "3NKBMuvWkpPFr6H7Apq3mnbdd2hsugAbMx")
//     .subscribe(Void => {}, err => logger.error(err))

// gdax.getBalance(Currency.BTC)
//     .do(balance => logger.info("balance", balance.toNumber()))
//     .flatMap(balance => gdax.placeOrder(new TradePair(Currency.BTC, Currency.ETH), balance, new BigNumber(0.03694)))
//     .subscribe(Void => {}, err => logger.error(err))

// gdax.getBalance(Currency.BTC)
//     .flatMap(balance => gdax.transfer(Currency.BTC, balance, "3NKBMuvWkpPFr6H7Apq3mnbdd2hsugAbMx"))
//     .subscribe(Void => {}, err => logger.error(err))
