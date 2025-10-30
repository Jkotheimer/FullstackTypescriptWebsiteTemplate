import SyntheticEventImpl from '@client/events/synthetic-event-impl';
import { NavNode } from 'types/nav';
interface NavigationEventDetail {
    location: NavNode;
}
export default class NavigationEvent<E extends HTMLElement = HTMLElement> extends SyntheticEventImpl<E> {
    detail: NavigationEventDetail;
    constructor(init: CustomEventInit, target?: E | null) {
        super('navigate', init, target);
        this.detail = init.detail as NavigationEventDetail;
    }
}
