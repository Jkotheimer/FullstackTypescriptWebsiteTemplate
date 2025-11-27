import ModuleEventBus, { ModuleEvent } from '@utils/events/module-event-bus';

const readyModules: Array<string> = [];
ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, (event) => {
    readyModules.push(event.detail.module.name);
});

export default class AsyncModule {
    protected static dependencies: Array<string> = [];
    private static readyDependencies: Set<string> = new Set<string>();

    static async signalInit(): Promise<void> {
        if (!this.dependencies.length) {
            ModuleEventBus.signalInit(this);
            return;
        }
        return new Promise<void>((resolve) => {
            for (const readyModule of readyModules) {
                if (this.dependencies.includes(readyModule)) {
                    this.readyDependencies.add(readyModule);
                }
            }
            const onModuleReady = async (event: ModuleEvent) => {
                if (this.dependencies.includes(event.detail.module.name)) {
                    this.readyDependencies.add(event.detail.module.name);
                }
                if (this.readyDependencies.size === this.dependencies.length) {
                    ModuleEventBus.signalInit(this);
                    ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, onModuleReady);
                    resolve();
                }
            };
            ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, onModuleReady);
        });
    }

    static signalReady(): void {
        ModuleEventBus.signalReady(this);
    }

    static signalError(error: Error): void {
        ModuleEventBus.signalError(this, error);
    }
}
