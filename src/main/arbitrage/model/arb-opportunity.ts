import {BigNumber} from 'bignumber.js'
import {Currency} from './../../util'

export class ArbOpportunity {

    constructor(
        public id: string,
        public createdAt: Date,
        public sourceExchange: string,
        public destExchange: string,
        public fromCurrency: Currency,
        public toCurrency: Currency,
        public sourceRate: BigNumber,
        public destRate: BigNumber,
        public percentage: BigNumber
    ) {}

    public static getPercentage(sourceRate: number | BigNumber, destRate: number | BigNumber): BigNumber {
        return new BigNumber(destRate)
            .minus(sourceRate)
            .div(sourceRate)
            .times(100)
    }
}
