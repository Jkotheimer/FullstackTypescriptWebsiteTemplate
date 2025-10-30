import SyntheticEventImpl from '@client/events/synthetic-event-impl';
export default class EnterEvent<E extends HTMLElement = HTMLElement> extends SyntheticEventImpl<E> {
    constructor(init: CustomEventInit, target?: E | null) {
        super('enter', init, target);
    }
}
