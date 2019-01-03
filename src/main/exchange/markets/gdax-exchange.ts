import {BigNumber} from 'bignumber.js'
import {TradePair, ExchangeRate, ExchangeOrder} from './../model'
import {Observable} from 'rxjs/Rx'
import {Currency, HttpClient, RandomUtil} from './../../util'
import {Exchange} from './exchange'
import {Config} from './../../config'
import {Inject} from 'ts-di/dist'
import {createLogger} from 'bunyan'
import * as crypto from 'crypto'

@Inject(Config, HttpClient)
export class GdaxExchange extends Exchange {

    private logger = createLogger({name: this.constructor.name})
    private baseUrl: string = "https://api.gdax.com/"
    private products: string[] = [
        "BTC-USD",
        "ETH-USD",
        "ETH-BTC",
        "LTC-BTC"
    ]

    constructor(private config: Config, private http: HttpClient) {
        super()
    }

    public getRate(tradePair: TradePair): Observable<ExchangeRate> {
        let product = this.getProductFromTradePair(tradePair)

        return this.http.get(this.baseUrl + "products/" + product + "/ticker", {
            headers: {
                "User-Agent": RandomUtil.generateId()
            }
        })
            .flatMap(res => {
                if(res.statusCode != 200) {
                    this.logger.error("GDAX rates fail", res.body)
                    throw new Error("GDAX rates fail")
                }
                let body = res.body

                let rate: BigNumber
                let reverseRate: BigNumber
                if(this.getTradePairSameDirectionAsProduct(tradePair)) {
                    rate = new BigNumber(1).div(body.bid)
                    reverseRate = new BigNumber(body.ask)
                } else {
                    rate = new BigNumber(body.ask)
                    reverseRate = new BigNumber(1).div(body.bid)
                }

                return Observable.of(new ExchangeRate(
                    new Date(),
                    this.constructor.name,
                    tradePair,
                    rate,
                    reverseRate,
                    new BigNumber(body.volume)
                ))
            })
    }

    public getSupportedTradeDirections(): TradePair[] {
        return [
            new TradePair(Currency.ETH, Currency.BTC)
        ]
    }

    public getDepositAddress(currency: Currency): string {
        switch(currency) {
            case Currency.BTC:
                return this.config.gdaxDepositAddressBtc
            case Currency.ETH:
                return this.config.gdaxDepositAddressEth
            default:
                throw new Error("Invalid currency")
        }
    }

    public getBalances(): Observable<Map<Currency, BigNumber>> {
        return this.performApiRequest("GET", "accounts")
            .flatMap((accounts: any[]) => Observable.from(accounts))
            .reduce((map, account) => map.set(account.currency, new BigNumber(account.available)), new Map<Currency, BigNumber>())
    }

    public getBalance(currency: Currency): Observable<BigNumber> {
        return this.getBalances()
            .flatMap(balances => {
                let balance = balances.get(currency)
                if(balance == null)
                    throw new Error("Invalid currency")
                return Observable.of(balance.decimalPlaces(8, 3))
            })
    }

    public placeOrder(pair: TradePair, quantity: BigNumber, rate: BigNumber): Observable<ExchangeOrder> {
        let params: any = {
            type: "market",
            product_id: this.getProductFromTradePair(pair),
            side: this.getTradePairSameDirectionAsProduct(pair) ? "sell" : "buy"
        }

        if(this.getTradePairSameDirectionAsProduct(pair))
            params.size = quantity.toFormat(8, 3)
        else
            params.funds = quantity.toFormat(8, 3)

        this.logger.debug(this.constructor.name, "placeOrder params", params)
        return this.performApiRequest("POST", "orders", params)
            .map(body => {
                this.logger.debug(this.constructor.name, "placeOrder response", body)
                let exchangeOrder = ExchangeOrder.create(this.constructor.name, pair)
                exchangeOrder.status = ExchangeOrder.Status.PLACED
                exchangeOrder.exchangeTxId = body.id
                return exchangeOrder
            })
    }

    public updateExchangeOrder(exchangeOrder: ExchangeOrder): Observable<ExchangeOrder> {
        return this.performApiRequest("GET", "orders/" + exchangeOrder.exchangeTxId)
            .map(body => {
                this.logger.debug(this.constructor.name, "updateExchangeOrder response", body)

                switch(body.status) {
                    case "open":
                    case "pending":
                    case "active":
                        break;
                    case "done":
                        exchangeOrder.status = ExchangeOrder.Status.FILLED

                        exchangeOrder.fees = new BigNumber(body.fill_fees)
                        exchangeOrder.feesCurrency = this.getTradePairFromProduct(body.product_id).to

                        if(body.specified_funds != null) {
                            exchangeOrder.achievedDestAmount = new BigNumber(body.funds)
                            exchangeOrder.achievedSourceAmount = new BigNumber(body.filled_size)
                        } else if(body.size != null) {
                            exchangeOrder.achievedDestAmount = new BigNumber(body.filled_size)
                            exchangeOrder.achievedSourceAmount = new BigNumber(body.executed_value)
                        } else
                            throw new Error("Neither specified_funds nor size found")

                        exchangeOrder.achievedRate = exchangeOrder.achievedSourceAmount.div(exchangeOrder.achievedDestAmount)
                        break;
                    default:
                        this.logger.error("Could not understand status:" + this.constructor.name, body.status)
                        throw new Error("Could not understand status on " + this.constructor.name)
                }

                return exchangeOrder
            })
    }

    public transfer(currency: Currency, quantity: BigNumber, destination: string): Observable<{}> {
        return this.performApiRequest("POST", "withdrawals/crypto", {
            amount: quantity.toFormat(8, 3),
            currency: currency.toString(),
            crypto_address: destination
        })
    }

    private getProductFromTradePair(pair: TradePair): string {
        let product = this.products.find(product => product == pair.from + "-" + pair.to || product == pair.to + "-" + pair.from)
        if(product == null)
            throw new Error("Product not found")
        return product
    }

    private getTradePairSameDirectionAsProduct(pair: TradePair): boolean {
        if(this.products.find(product => product == pair.from + "-" + pair.to) != null)
            return true
        if(this.products.find(product => product == pair.to + "-" + pair.from) != null)
            return false
        throw new Error("Product not found")
    }

    private getTradePairFromProduct(product: string): TradePair {
        try {
            let currencies = product.split("-")
            return new TradePair(Currency[currencies[0]], Currency[currencies[1]])
        } catch(e) {
            throw new Error("Currency not supported in product " + product)
        }
    }

    private performApiRequest(method: string, path: string, body?: any): Observable<any> {
        let timestamp = new Date().getTime() / 1000
        let signature = this.getSignature(timestamp, method, path, body)
        return this.http.request({
            url: this.baseUrl + path,
            method: method,
            headers: {
                "CB-ACCESS-KEY": this.config.gdaxApiKey,
                "CB-ACCESS-SIGN": signature,
                "CB-ACCESS-TIMESTAMP": timestamp,
                "CB-ACCESS-PASSPHRASE": this.config.gdaxPassphrase,
                "User-Agent": RandomUtil.generateId()
            },
            body: body
        })
            .flatMap(res => {
                if(res.statusCode != 200) {
                    this.logger.error(this.constructor.name + " fail", path, res.body)
                    throw new Error(this.constructor.name + " fail")
                }
                return Observable.of(res.body)
            })
    }

    private getSignature(timestamp: number, method: string, path: string, body: any = {}): string {
        let bodyString = Object.keys(body).length == 0 ? "" : JSON.stringify(body)
        let secret = new Buffer(this.config.gdaxSecretKey, 'base64')
        return crypto.createHmac('sha256', secret)
            .update(timestamp + method + "/" + path + bodyString)
            .digest('base64')
    }
}

/**
10 USD->BTC
{
    id: 'c08ac5fc-f49c-449d-ae30-525596ba4b96',
    product_id: 'BTC-USD',
    side: 'buy',
    stp: 'dc',
    funds: '9.9750623400000000',
    specified_funds: '10.0000000000000000',
    type: 'market',
    post_only: false,
    created_at: '2017-04-08T04:19:29.271326Z',
    done_at: '2017-04-08T04:19:29.289Z',
    done_reason: 'filled',
    fill_fees: '0.0249376419840000',
    filled_size: '0.00835264',
    executed_value: '9.9750567936000000',
    status: 'done',
    settled: true
}

0.01252927 BTC->USD
{
    id: 'd61c5dd2-a066-4d00-9f54-e37ef9c7203b',
    size: '0.01252927',
    product_id: 'BTC-USD',
    side: 'buy',
    stp: 'dc',
    funds: '4972.5685925600000000',
    type: 'market',
    post_only: false,
    created_at: '2017-04-08T04:26:37.628601Z',
    done_at: '2017-04-08T04:26:37.699Z',
    done_reason: 'filled',
    fill_fees: '0.0374045694262500',
    filled_size: '0.01252927',
    executed_value: '14.9618277705000000',
    status: 'done',
    settled: true
}
*/
