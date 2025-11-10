import Constants from '@constants/shared';
import Session from 'express-session';
import { randomUUID } from 'crypto';

if (!process.env.SESSION_SECRET) {
    throw new Error(
        'SESSION SECRET IS MISSING FROM ENVIRONMENT! Unable to start the server without a valid session secret'
    );
}

export default Session({
    secret: process.env.SESSION_SECRET,
    name: Constants.SESSION.COOKIE_NAME,
    saveUninitialized: true,
    unset: 'destroy',
    rolling: false,
    resave: false,
    proxy: false,
    genid: () => {
        return randomUUID({
            disableEntropyCache: false
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
