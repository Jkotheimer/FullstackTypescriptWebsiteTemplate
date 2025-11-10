import Constants from '@constants/shared';
import Session from 'express-session';
import { randomUUID } from 'crypto';
import fs from 'fs';

if (!fs.existsSync(process.env.SESSION_SECRET_FILE)) {
    throw new Error(
        `SESSION SECRET FILE IS MISSING! Ensure there is a valid secret file located at ${process.env.SESSION_SECRET_FILE}`
    );
}

const SESSION_SECRET = fs.readFileSync(process.env.SESSION_SECRET_FILE).toString();

export default Session({
    secret: SESSION_SECRET,
    name: Constants.SESSION.COOKIE_NAME,
    saveUninitialized: true,
    unset: 'destroy',
    rolling: false,
    resave: false,
    proxy: false,
    genid: () => {
        return randomUUID({
            disableEntropyCache: true
        });
    },
    cookie: {
        path: '/',
        maxAge: Constants.SESSION.MAX_AGE,
        httpOnly: true,
        secure: true,
        sameSite: true,
        signed: true
    }
});
