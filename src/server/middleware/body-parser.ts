import { Request, Response } from 'express';
import JsonApiResponse from '@models/jsonapi';
import Constants from '@constants/shared';
import Limits from '@constants/limits';

const SUPPORTED_JSON_CONTENT_TYPES = new Set<string>(['application/json', 'application/vnd.api+json']);
const SUPPORTED_URL_ENCODINGS = new Set<string>(['application/x-www-form-urlencoded']);

export default function json(request: Request, response: Response, next: Function) {
    let payloadLength: number = 0;
    let payloadChunks: Array<string> = [];
    const onChunk = (chunk: Buffer) => {
        if (payloadLength + chunk.length > Limits.PAYLOAD_MAX_LENGTH) {
            request.removeListener('data', onChunk);
            request.removeListener('end', onEnd);
            const jsonApiPayload = new JsonApiResponse();
            jsonApiPayload.addError({
                title: 'Payload Too Large',
                detail: `Your payload exceeded ${Limits.PAYLOAD_MAX_LENGTH} bytes.`,
                status: Constants.HTTP_STATUS_CODES.BAD_REQUEST.toString(),
                code: Constants.ERROR_CODES.BAD_REQUEST
            });
            request.destroy();
            response.status(Constants.HTTP_STATUS_CODES.BAD_REQUEST).json(jsonApiPayload);
        } else {
            payloadChunks.push(chunk.toString());
            payloadLength += chunk.length;
        }
    };
    const onEnd = () => {
        request.removeListener('data', onChunk);
        request.removeListener('end', onEnd);
        if (payloadLength <= 0) {
            next();
            return;
        }
        const contentType = request.headers['content-type'];
        if (!contentType) {
            const jsonApiPayload = new JsonApiResponse();
            jsonApiPayload.addError({
                title: 'Content Type Not Specified',
                detail: `You provided a ${payloadLength} byte payload, but didn't specify a content type. I refuse to parse this! Try again.`,
                status: Constants.HTTP_STATUS_CODES.BAD_REQUEST.toString(),
                code: Constants.ERROR_CODES.BAD_REQUEST
            });
            response.status(Constants.HTTP_STATUS_CODES.BAD_REQUEST).json(jsonApiPayload);
            return;
        }
        try {
            const payload = payloadChunks.join('');
            if (SUPPORTED_JSON_CONTENT_TYPES.has(contentType)) {
                request.body = JSON.parse(payload);
            } else if (SUPPORTED_URL_ENCODINGS.has(contentType)) {
                // TODO : make this more robust (like handling nested objects, arrays, and boolean flags)
                const convertedJson =
                    '{"' + decodeURI(payload).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}';
                request.body = JSON.parse(convertedJson);
            } else {
                const jsonApiPayload = new JsonApiResponse();
                jsonApiPayload.addError({
                    title: 'Invalid Content Type',
                    detail: `We are unable to parse data with this content type: ${contentType}`,
                    status: Constants.HTTP_STATUS_CODES.BAD_REQUEST.toString(),
                    code: Constants.ERROR_CODES.BAD_REQUEST
                });
                response.status(Constants.HTTP_STATUS_CODES.BAD_REQUEST).json(jsonApiPayload);
                return;
            }
            next();
        } catch (error) {
            const jsonApiPayload = new JsonApiResponse();
            jsonApiPayload.addError({
                title: 'Invalid Payload',
                detail: `We were unable to parse your ${contentType} payload`,
                status: Constants.HTTP_STATUS_CODES.BAD_REQUEST.toString(),
                code: Constants.ERROR_CODES.BAD_REQUEST
            });
            response.status(Constants.HTTP_STATUS_CODES.BAD_REQUEST).json(jsonApiPayload);
        }
    };
    request.on('data', onChunk);
    request.on('end', onEnd);
}
