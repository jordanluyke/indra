import {BigNumber} from 'bignumber.js'
import {TradePair, ExchangeRate, ExchangeOrder} from './../model'
import {Observable} from 'rxjs/Rx'
import {Currency, HttpClient} from './../../util'
import {Exchange} from './exchange'
import {Config} from './../../config'
import {Inject} from 'ts-di/dist'
import {createLogger} from 'bunyan'
import * as crypto from 'crypto'
import * as querystring from 'querystring'

@Inject(Config, HttpClient)
export class KrakenExchange extends Exchange {

    private logger = createLogger({name: this.constructor.name})
    private baseUrl: string = "https://api.kraken.com"
    private products = [
        "XETHXXBT",
        "XETHZUSD",
        "XXBTZUSD",
        "XETHXXBT",
        "XLTCXXBT",
        "XLTCZUSD"
    ]
    private currencySigns: Map<Currency, string> = new Map<Currency, string>()
        .set(Currency.BTC, "XXBT")
        .set(Currency.ETH, "XETH")
        .set(Currency.USD, "ZUSD")
        .set(Currency.LTC, "XLTC")

    constructor(private config: Config, private http: HttpClient) {
        super()
    }

    public getRate(tradePair: TradePair): Observable<ExchangeRate> {
        let product = this.getProductFromTradePair(tradePair)
        return this.http.get(this.baseUrl + "/0/public/Ticker", {
            qs: {
                pair: product
            }
        })
            .flatMap(res => {
                if(res.statusCode != 200) {
                    this.logger.error("Kraken rates fail:", res.statusCode, res.body)
                    throw new Error("Kraken rates fail")
                }
                if(res.body.error.length > 0) {
                    this.logger.error("Kraken rates fail:", res.body.error[0])
                    throw new Error("Kraken rates fail")
                }
                let body = res.body
                let ticker = body.result[product]

                let rate: BigNumber
                let reverseRate: BigNumber
                if(this.getTradePairSameDirectionAsProduct(tradePair)) {
                    rate = new BigNumber(1).div(ticker.b[0])
                    reverseRate = new BigNumber(ticker.a[0])
                } else {
                    rate = new BigNumber(ticker.a[0])
                    reverseRate = new BigNumber(1).div(ticker.b[0])
                }

                return Observable.of(new ExchangeRate(
                    new Date(),
                    this.constructor.name,
                    tradePair,
                    rate,
                    reverseRate,
                    new BigNumber(ticker.b[1])))
            })
    }

    public getSupportedTradeDirections(): TradePair[] {
        return [
            new TradePair(Currency.BTC, Currency.ETH)
        ]
    }

    public getDepositAddress(currency: Currency): string {
        switch(currency) {
            case Currency.BTC:
                return this.config.krakenDepositAddressBtc
            case Currency.ETH:
                return this.config.krakenDepositAddressEth
            default:
                throw new Error("Invalid currency")
        }
    }

    public getBalances(): Observable<Map<Currency, BigNumber>> {
        return this.performApiRequest("Balance")
            .flatMap(body => Observable.from(Object.keys(body))
                .reduce((map, current) => {
                    let currency = this.getCurrencyFromSign(current)
                    if(currency == null)
                        return map
                    return map.set(currency, new BigNumber(body[current]))
                }, new Map<Currency, BigNumber>()))
    }

    public getBalance(currency: Currency): Observable<BigNumber> {
        return this.getBalances()
            .flatMap(balances => {
                let balance = balances.get(currency)
                if(balance == null)
                    throw new Error("Invalid currency")
                return Observable.of(balance)
            })
    }

    public placeOrder(pair: TradePair, quantity: BigNumber, rate: BigNumber): Observable<ExchangeOrder> {
        let params: any = {
            ordertype: "market",
            pair: this.getProductFromTradePair(pair),
            type: this.getTradePairSameDirectionAsProduct(pair) ? "sell" : "buy",
            volume: quantity.toFormat(8, 3)
        }

        let oflags: string[] = []
        if(this.getTradePairSameDirectionAsProduct(pair)) {
            oflags.push("fciq")
        } else {
            oflags.push("fcib")
            oflags.push("viqc")
        }
        params.oflags = oflags.join(",")

        this.logger.debug(this.constructor.name, "placeOrder request", params)
        return this.performApiRequest("AddOrder", params)
            .map(body => {
                this.logger.debug(this.constructor.name, "updateExchangeOrder response:", body)
                let exchangeOrder = ExchangeOrder.create(this.constructor.name, pair)
                exchangeOrder.status = ExchangeOrder.Status.PLACED
                if(body.txid == null) {
                    this.logger.error("Could not parse Kraken body", body)
                    throw new Error("Kraken place order fail")
                }
                if(body.txid.length > 1)
                    this.logger.error("Not sure why kraken provided multiple transaction id's")
                exchangeOrder.exchangeTxId = body.txid[0]
                return exchangeOrder
            })
    }

    public updateExchangeOrder(exchangeOrder: ExchangeOrder): Observable<ExchangeOrder> {
        return this.performApiRequest("QueryOrders", {
            trades: true,
            txid: exchangeOrder.exchangeTxId
        })
            .map(res => {
                if(exchangeOrder.exchangeTxId == null)
                    throw new Error("exchangeTxId not found")
                let body = res[exchangeOrder.exchangeTxId]
                this.logger.debug(this.constructor.name, "updateExchangeOrder response", body)

                switch(body.status) {
                    case "pending":
                    case "open":
                        break;
                    case "closed":
                        exchangeOrder.status = ExchangeOrder.Status.FILLED

                        exchangeOrder.fees = new BigNumber(body.fee)
                        exchangeOrder.feesCurrency = exchangeOrder.destCurrency

                        exchangeOrder.achievedSourceAmount = new BigNumber(body.vol_exec)
                        exchangeOrder.achievedDestAmount = new BigNumber(body.cost)
                        exchangeOrder.achievedRate = exchangeOrder.achievedSourceAmount.div(exchangeOrder.achievedDestAmount)
                        break;
                    case "canceled":
                        exchangeOrder.status = ExchangeOrder.Status.CANCELLED
                        break;
                    case "expired":
                        exchangeOrder.status = ExchangeOrder.Status.FAILED
                        break;
                    default:
                        this.logger.error("Could not understand status:" + this.constructor.name, body.status)
                        throw new Error("Could not understand status on " + this.constructor.name)
                }

                return exchangeOrder
            })
    }

    public transfer(currency: Currency, quantity: BigNumber, destination: string): Observable<{}> {
        let asset = this.currencySigns.get(currency)
        if(asset == null)
            throw new Error("Invalid currency")
        return this.performApiRequest("Withdraw", {
            asset: asset,
            key: destination,
            amount: quantity.toNumber()
        })
    }

    private performApiRequest(path: string, body?: any): Observable<any> {
        let apiPath = "/0/private/" + path
        let nonce = new Date().getTime()
        body = Object.assign({
            nonce: nonce,
            otp: this.config.krakenOtp
        }, body || {})
        let signature = this.getSignature(apiPath, body, nonce)
        return this.http.post(this.baseUrl + apiPath, {
            headers: {
                "API-Key": this.config.krakenApiKey,
                "API-Sign": signature
            },
            form: body
        })
            .flatMap(res => {
                if(res.statusCode != 200) {
                    this.logger.error("Kraken fail:", res.statusCode, res.body)
                    throw new Error("Kraken fail")
                }
                if(res.body.error.length > 0) {
                    this.logger.error("Kraken fail:", res.body.error[0], body)
                    throw new Error("Kraken fail")
                }
                return Observable.of(res.body.result)
            })
    }

    private getCurrencyFromSign(sign: string): Currency | undefined {
        let result = Array.from(this.currencySigns.entries()).find(pair => sign == pair[1])
        if(result == null)
            return undefined
        return result[0]
    }

    private getProductFromTradePair(pair: TradePair): string {
        let from = this.currencySigns.get(pair.from)
        let to = this.currencySigns.get(pair.to)
        if(from == null || to == null)
            throw new Error("Invalid currency")
        for(let product of this.products)
            if(product == from + to || product == to + from)
                return product
        throw new Error("Invalid pair")
    }

    private getTradePairSameDirectionAsProduct(pair: TradePair): boolean {
        let from = this.currencySigns.get(pair.from)
        let to = this.currencySigns.get(pair.to)
        if(from == null || to == null)
            throw new Error("Invalid currency")
        for(let product of this.products) {
            if(product == from + to)
                return true
            if(product == to + from)
                return false
        }
        throw new Error("Invalid pair")
    }

    private getSignature(apiPath: string, body: any = {}, nonce: number): string {
        let message = querystring.stringify(body)
        let hash = crypto.createHash('sha256').update(nonce + message).digest('latin1')
        let secret = new Buffer(this.config.krakenSecretKey, 'base64')
        return crypto.createHmac('sha512', secret).update(apiPath + hash, 'latin1').digest('base64')
    }
}

/**
10 USD->BTC
placeOrder
{
    descr: {
        order: 'buy 10.00000000 (USD) XBTUSD @ market'
    },
    txid: [ 'OF7HFY-SKR2A-7PX62C' ]
}

updateOrder
{
    'OF7HFY-SKR2A-7PX62C': {
        refid: null,
        userref: null,
        status: 'closed',
        reason: null,
        opentm: 1491697524.7478,
        closetm: 1491697525.0111,
        starttm: 0,
        expiretm: 0,
        descr: {
            pair: 'XBTUSD',
            type: 'buy',
            ordertype: 'market',
            price: '0',
            price2: '0',
            leverage: 'none',
            order: 'buy 10.00000000 (USD) XBTUSD @ market'
        },
        vol: '10.00000000',
        vol_exec: '10.00000000',
        cost: '0.008',
        fee: '0.026',
        price: '1187.648',
        misc: '',
        oflags: 'viqc,fcib',
        trades: [ 'T2YRBC-3FYXE-HP2WGG' ]
    }
}

0.008 BTC->USD
placeOrder
{
    descr: {
        order: 'sell 0.00800000 XBTUSD @ market'
    },
    txid: [ 'OLWAHX-42ZYP-QCNZXR' ]
}

updateOrder
{
    'OLWAHX-42ZYP-QCNZXR': {
        refid: null,
        userref: null,
        status: 'closed',
        reason: null,
        opentm: 1491697258.2905,
        closetm: 1491697258.7685,
        starttm: 0,
        expiretm: 0,
        descr: {
            pair: 'XBTUSD',
            type: 'sell',
            ordertype: 'market',
            price: '0',
            price2: '0',
            leverage: 'none',
            order: 'sell 0.00800000 XBTUSD @ market'
        },
        vol: '0.00800000',
        vol_exec: '0.00800000',
        cost: '9.472',
        fee: '0.024',
        price: '1184.045',
        misc: '',
        oflags: 'fciq',
        trades: [ 'TQCJS3-2XK5R-UI4FI3' ]
    }
}
 */
