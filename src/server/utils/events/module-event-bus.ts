export interface ModuleEventDetail {
    module: Function;
    error?: Error;
}
export interface ModuleEventInit extends CustomEventInit {
    detail: ModuleEventDetail;
}
export class ModuleEvent extends Event {
    detail: ModuleEventDetail;
    constructor(eventType: string, init: ModuleEventInit) {
        super(eventType, init);
        this.detail = init.detail;
    }
}
export type ModuleEventListener = (event: ModuleEvent) => void;
export default class ModuleEventBus {
    private static listeners: Record<string, Set<ModuleEventListener>> = {};
    private static eventHistory: Record<string, Array<ModuleEvent>> = {};

    public static readonly SYSTEM_EVENTS = {
        MODULE_INIT: '__MODULE_INIT__',
        MODULE_READY: '__MODULE_READY__',
        MODULE_ERROR: '__MODULE_ERROR__'
    };

    public static addEventListener(eventType: string, listener: ModuleEventListener) {
        if (!ModuleEventBus.listeners[eventType]) {
            ModuleEventBus.listeners[eventType] = new Set<ModuleEventListener>([listener]);
        } else {
            ModuleEventBus.listeners[eventType].add(listener);
        }
        if (ModuleEventBus.eventHistory[eventType]) {
            ModuleEventBus.eventHistory[eventType].forEach(listener);
        }
    }

    public static removeEventListener(eventType: string, listener: ModuleEventListener) {
        if (ModuleEventBus.listeners[eventType]?.has(listener)) {
            ModuleEventBus.listeners[eventType].delete(listener);
        }
    }

    public static publish(event: ModuleEvent) {
        if (!ModuleEventBus.eventHistory[event.type]) {
            ModuleEventBus.eventHistory[event.type] = [event];
        } else {
            ModuleEventBus.eventHistory[event.type].push(event);
        }
        if (!ModuleEventBus.listeners[event.type]) {
            return;
        }
        Array.from(ModuleEventBus.listeners[event.type]).forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error(error);
            }
        });
    }

    public static signalInit(module: Function) {
        ModuleEventBus.publish(
            new ModuleEvent(ModuleEventBus.SYSTEM_EVENTS.MODULE_INIT, {
                detail: {
                    module
                }
            })
        );
    }

    public static signalReady(module: Function) {
        ModuleEventBus.publish(
            new ModuleEvent(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, {
                detail: {
                    module
                }
            })
        );
    }

    public static signalError(module: Function, error: Error) {
        ModuleEventBus.publish(
            new ModuleEvent(ModuleEventBus.SYSTEM_EVENTS.MODULE_ERROR, {
                detail: {
                    module,
                    error
                }
            })
        );
    }
}
