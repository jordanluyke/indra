import {BigNumber} from 'bignumber.js'
import {TradePair} from './trade-pair'

export class ExchangeRate {

    constructor(
        public createdAt: Date,
        public className: string,
        public tradePair: TradePair,
        public rate: BigNumber,
        public reverseRate: BigNumber,
        public volume: BigNumber
    ) {}
}
