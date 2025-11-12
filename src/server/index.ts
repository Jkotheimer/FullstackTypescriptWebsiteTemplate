/**
 * This file defines all exposed api endpoints
 */
import Express from 'express';
import helmet from 'helmet';

import ModuleEventBus, { ModuleEvent } from '@utils/events/module-event-bus';
import { handle404, handleServerError } from '@middleware/error-handlers';
import JsonMiddleware from '@middleware/json-payload-parser';
import SessionMiddleware from '@middleware/session';
import StaticFiles from '@middleware/static-files';
import Constants from '@constants/shared';
import API from '@api/index';

// Initialize Express app
const app = Express();
app.disable('x-powered-by');
app.use(helmet({}));
app.use(SessionMiddleware);
app.use(JsonMiddleware);
app.use('/', StaticFiles);
app.use('/api', API);
app.use(handle404);
app.use(handleServerError);

// Wait for all async modules to initialize before starting the server
const asyncModules: Set<Function> = new Set<Function>();

function handleModuleInit(event: ModuleEvent) {
    console.log('Module initializing:', event.detail.module.name);
    asyncModules.add(event.detail.module);
}

function handleModuleError(event: ModuleEvent) {
    console.error('Error occurred while initializing', event.detail.module.name);
    console.error(event.detail.error);
    process.exit(1);
}

function handleModuleReady(event: ModuleEvent) {
    asyncModules.delete(event.detail.module);
    if (asyncModules.size) {
        return;
    }
    ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_INIT, handleModuleInit);
    ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, handleModuleReady);
    ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_ERROR, handleModuleError);
    app.listen(Constants.PORT, () => {
        console.log(`Server is running on http://localhost:${Constants.PORT}`);
    });
}

ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_INIT, handleModuleInit);
ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, handleModuleReady);
ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_ERROR, handleModuleError);
