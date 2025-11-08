/**
 * This file defines all exposed api endpoints
 */
import Express from 'express';
import Session from 'express-session';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import path from 'path';

import ModuleEventBus, { ModuleEvent } from '@utils/events/module-event-bus';
import Constants from '@constants/shared';
import v1 from '@api/v1/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versions: Record<string, Express.Router> = {
    v1
};

// Initialize Express app
const app = Express();

app.disable('x-powered-by');

// Parse all request bodies as JSON
app.use(
    Express.json({
        inflate: true,
        strict: true,
        limit: '1kb'
    })
);

app.use(
    Session({
        secret: 'abc123',
        name: 'session_id',
        resave: false,
        saveUninitialized: true,
        genid: () => {
            return randomUUID();
        },
        cookie: {
            path: '/',
            maxAge: 120000,
            secure: false
        }
    })
);

// TODO: Debug this
app.use('/public', Express.static(path.resolve(__dirname, '/public')));

Object.keys(versions).forEach((vx) => app.use(`/api/${vx}`, versions[vx]));

// Wait for all modules to initialize before starting the server
const modules: Set<Function> = new Set<Function>();

function handleModuleInit(event: ModuleEvent) {
    modules.add(event.detail.module);
}

function handleModuleError(event: ModuleEvent) {
    console.error('Error occurred while initializing', event.detail.module.name);
    if (event.detail.error) {
        console.error(event.detail.error);
    } else {
        console.error(
            'Unknown error occurred. Event details:',
            event.type,
            event.detail.module.name,
            event.detail.error
        );
    }
    process.exit(1);
}

function handleModuleReady(event: ModuleEvent) {
    modules.delete(event.detail.module);
    if (!modules.size) {
        ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_INIT, handleModuleInit);
        ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, handleModuleReady);
        ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_ERROR, handleModuleError);
        app.listen(Constants.PORT, () => {
            console.log(`Server is running on http://localhost:${Constants.PORT}`);
        });
    }
}

ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_INIT, handleModuleInit);
ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, handleModuleReady);
ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_ERROR, handleModuleError);
