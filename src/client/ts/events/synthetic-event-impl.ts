import React from 'react';

interface SyntheticEventDetail {
    [key: string]: any;
}

export default class SyntheticEventImpl<E extends HTMLElement = HTMLElement> implements React.SyntheticEvent<E> {
    target: E;
    currentTarget: E;
    nativeEvent: Event;

    propagationStopped: boolean;
    defaultPrevented: boolean;
    cancelable: boolean;
    isTrusted: boolean;
    bubbles: boolean;

    eventPhase: number;
    timeStamp: number;

    detail: SyntheticEventDetail;
    type: string;

    constructor(type: string, init: CustomEventInit, target?: E | null) {
        this.nativeEvent = new CustomEvent(type, init);

        // Targets
        if (target != null) {
            this.currentTarget = target;
            this.target = target;
        } else {
            this.currentTarget = this.nativeEvent.currentTarget as E;
            this.target = this.nativeEvent.target as E;
        }

        // Native values
        this.defaultPrevented = this.nativeEvent.defaultPrevented;
        this.cancelable = this.nativeEvent.cancelable;
        this.bubbles = this.nativeEvent.bubbles;
        this.timeStamp = this.nativeEvent.timeStamp;
        this.eventPhase = this.nativeEvent.eventPhase;
        this.isTrusted = this.nativeEvent.isTrusted;

        // Custom values
        this.propagationStopped = false;
        this.type = type;
        if (init.detail) {
            this.detail = init.detail;
        } else {
            this.detail = {};
        }
    }

    isDefaultPrevented(): boolean {
        return this.defaultPrevented;
    }

    isPropagationStopped(): boolean {
        return this.propagationStopped;
    }

    stopPropagation(): void {
        this.nativeEvent.stopPropagation();
        this.propagationStopped = true;
    }

    preventDefault(): void {
        this.nativeEvent.preventDefault();
        this.propagationStopped = true;
    }

    persist(): void {
        throw new Error('Method not implemented.');
    }
}
