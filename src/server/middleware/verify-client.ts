import { Request, Response } from 'express';
import Constants from '@constants/shared';
import JsonApiResponse from '@models/jsonapi';

export default function verifyClient(request: Request, response: Response, next: Function) {
    // Request must come from an authorized client
    const clientId = request.header(Constants.HEADERS.CLIENT_ID);
    if (!clientId) {
        const jsonapiResponse = new JsonApiResponse();
        jsonapiResponse.addError({
            title: 'Invalid Client',
            detail: Constants.ERROR_MESSAGES.INVALID_CLIENT_ID,
            status: Constants.ERROR_CODES.BAD_REQUEST.toString(),
            code: Constants.ERROR_CODES.BAD_REQUEST
        });
        response.status(400).json(jsonapiResponse);
    }
    next();
}
