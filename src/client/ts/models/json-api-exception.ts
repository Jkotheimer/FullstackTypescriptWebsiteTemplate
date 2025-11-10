import { JsonApiPayload } from 'jsonapi-types';
export default class JsonApiException extends Error {
    public payload: JsonApiPayload;
    constructor(payload: JsonApiPayload) {
        super(
            payload.errors?.map((error) => error.detail).join(', ') || payload.message || 'An unknown error occurred'
        );
        Object.setPrototypeOf(this, JsonApiException.prototype);
        this.payload = payload;
    }
}
