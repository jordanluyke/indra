import {BigNumber} from 'bignumber.js'

export class MathUtil {

    public static clamp(val: number | string | BigNumber, min: number | string | BigNumber, max: number | string | BigNumber): BigNumber {
        return BigNumber.min(BigNumber.max(val, min), max)
    }
}
