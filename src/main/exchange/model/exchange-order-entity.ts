import {Entity, Column, PrimaryColumn} from 'typeorm';

@Entity("exchange_order")
export class ExchangeOrderEntity {

    @PrimaryColumn()
    id: string

    @Column()
    createdAt: number

    @Column()
    status: string

    @Column()
    exchange: string

    @Column()
    sourceCurrency: string

    @Column()
    destCurrency: string

    @Column({nullable: true})
    exchangeTxId?: string

    @Column({nullable: true})
    arbOpportunityId?: string

    @Column({nullable: true})
    sourceAmount?: number

    @Column({nullable: true})
    destAmount?: number

    @Column({nullable: true})
    rate?: number

    @Column({nullable: true})
    fees?: number

    @Column({nullable: true})
    feesCurrency?: string

    @Column({nullable: true})
    achievedSourceAmount?: number

    @Column({nullable: true})
    achievedDestAmount?: number

    @Column({nullable: true})
    achievedRate?: number
}
