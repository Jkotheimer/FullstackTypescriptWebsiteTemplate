/**
 * This file defines all exposed api endpoints
 */
import Express from 'express';
import Session from 'express-session';
import Constants from '@constants/shared';
import v1 from '@api/v1/index';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versions: Record<string, Express.Router> = {
    v1
};

// Initialize Express app
const app = Express();

// Parse all request bodies as JSON
app.use(
    Express.json({
        inflate: true,
        strict: true,
        limit: '1mb'
    })
);

app.use(
    Session({
        secret: 'abc123',
        resave: false,
        saveUninitialized: true,
        cookie: {
            path: '/',
            maxAge: 120000,
            secure: false
        }
    })
);

// TODO: Debug this
app.use(Express.static(path.resolve(__dirname, '/public')));

Object.keys(versions).forEach((vx) => {
    console.log(`Using ${vx}: `, versions[vx]);
    app.use(`/api/${vx}`, versions[vx]);
});

// Start the server
app.listen(Constants.PORT, () => {
    console.log(`Server is running on http://localhost:${Constants.PORT}`);
});
