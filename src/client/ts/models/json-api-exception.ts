import { JSONAPIPayload } from 'types/jsonapi';
export default class JSONAPIException extends Error {
    public payload: JSONAPIPayload;
    constructor(payload: JSONAPIPayload) {
        super(
            payload.errors?.map((error) => error.detail).join(', ') || payload.message || 'An unknown error occurred'
        );
        Object.setPrototypeOf(this, JSONAPIException.prototype);
        this.payload = payload;
    }
}
