import ModuleEventBus from '@utils/events/module-event-bus';
export default class AsyncModule {
    protected static priority: number = 0; // low numbers are higher priority

    static signalInit() {
        setTimeout(() => ModuleEventBus.signalInit(this), this.priority);
    }

    static signalReady() {
        setTimeout(() => ModuleEventBus.signalReady(this), this.priority);
    }

    static signalError(error: Error) {
        setTimeout(() => ModuleEventBus.signalError(this, error), this.priority);
    }
}
