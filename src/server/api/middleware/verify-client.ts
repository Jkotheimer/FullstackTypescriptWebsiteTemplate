import { Request, Response } from 'express';
import Constants from '@constants/shared';
//import { RequestError } from '@database/models/errors';

function verifyClient(request: Request, response: Response, next: Function) {
    // Request must come from an authorized client
    const clientId = request.header(Constants.HEADERS.CLIENT_ID);
    if (!clientId) {
        response.status(400).json({});
    }
    next();
}

export default verifyClient;
