import {Currency} from './../../util'

export class TradePair {

    constructor(public from: Currency, public to: Currency) {
    }

    public reverse(): TradePair {
        return new TradePair(this.to, this.from)
    }

    public equals(tradePair: TradePair): boolean {
        return this.from == tradePair.from && this.to == tradePair.to
    }

    public toString(): string {
        return this.from.toString() + this.to.toString()
    }
}
