import SyntheticEventImpl from '@client/events/synthetic-event-impl';
interface ChangeEventDetail {
    value: any;
}
export default class ChangeEvent<E extends HTMLElement = HTMLElement> extends SyntheticEventImpl<E> {
    detail: ChangeEventDetail;
    constructor(init: CustomEventInit, target?: E | null) {
        super('change', init, target);
        this.detail = init.detail as ChangeEventDetail;
    }
}
