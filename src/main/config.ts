import {TradePair, GdaxExchange, KrakenExchange} from './exchange'
import {Currency} from './util'
import {BigNumber} from 'bignumber.js'
import * as dotenv from 'dotenv'

dotenv.config()

export class Config {

    public supportedExchangePairs: TradePair[] = [
        new TradePair(Currency.ETH, Currency.BTC)
    ]

    public exchanges: any[] = [
        GdaxExchange,
        KrakenExchange
    ]

    public minExecutionPercentage: BigNumber = new BigNumber(process.env.MIN_EXECUTION_PERCENTAGE || 1)

    public minimumBalances: Map<Currency, BigNumber> = new Map<Currency, BigNumber>()
        .set(Currency.BTC, new BigNumber(1))
        .set(Currency.ETH, new BigNumber(21))

    public maxTradeSize: Map<Currency, BigNumber> = new Map<Currency, BigNumber>()
        .set(Currency.BTC, new BigNumber(10))
        .set(Currency.ETH, new BigNumber(200))

    public mysqlHost: string = "localhost"
    public mysqlPort: number = 3306
    public mysqlDatabase: string = "indra"
    public mysqlUser: string = "root"
    public mysqlPassword: string = "abcd1234"

    public krakenApiKey: string = process.env.KRAKEN_API_KEY
    public krakenSecretKey: string = process.env.KRAKEN_SECRET_KEY
    public krakenOtp: string = process.env.KRAKEN_OTP
    public krakenDepositAddressBtc: string = process.env.KRAKEN_DEPOSIT_ADDRESS_BTC
    public krakenDepositAddressEth: string = process.env.KRAKEN_DEPOSIT_ADDRESS_ETH

    public gdaxApiKey: string = process.env.GDAX_API_KEY
    public gdaxSecretKey: string = process.env.GDAX_SECRET_KEY
    public gdaxPassphrase: string = process.env.GDAX_PASSPHRASE
    public gdaxDepositAddressBtc: string = process.env.GDAX_DEPOSIT_ADDRESS_BTC
    public gdaxDepositAddressEth: string = process.env.GDAX_DEPOSIT_ADDRESS_ETH
}
