import {BaseEvent} from './../../event-bus'
import {ArbOpportunity} from './../model'

export class ArbOpportunityCreatedEvent extends BaseEvent {

    constructor(public arbOpportunity: ArbOpportunity) {
        super("Arb opportunity created")
    }
}
