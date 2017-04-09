import {Entity, Column, PrimaryColumn} from 'typeorm';

@Entity("arb_opportunity")
export class ArbOpportunityEntity {

    @PrimaryColumn()
    id: string

    @Column()
    createdAt: number

    @Column()
    sourceExchange: string

    @Column()
    destExchange: string

    @Column()
    fromCurrency: string

    @Column()
    toCurrency: string

    @Column()
    sourceRate: number

    @Column()
    destRate: number

    @Column()
    percentage: number
}
