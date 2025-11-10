import Express, { Request, Response } from 'express';
import JsonApiResponse from '@models/jsonapi';
import Constants from '@constants/shared';

export default Express.json({
    inflate: true,
    strict: true,
    limit: '1kb',
    verify: (request: Request, response: Response, buffer: Buffer, encoding: string) => {
        console.log('Encoding:', encoding);
        console.log('Buffer:', buffer);
        if (request.headers['content-type'] !== 'application/json') {
            const jsonapiPayload = new JsonApiResponse();
            jsonapiPayload.addError({
                title: 'Invalid Content Type',
                detail: 'This api only supports the "application/json" content type.',
                code: Constants.HTTP_STATUS_CODES.BAD_REQUEST.toString(),
                status: Constants.ERROR_CODES.BAD_REQUEST
            });
            response.status(400).json(jsonapiPayload);
        }
    }
});
