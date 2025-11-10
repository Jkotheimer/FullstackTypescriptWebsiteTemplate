import type {
    JsonApiData,
    JsonApiError,
    JsonApiMetadata,
    JsonApiInfo,
    JsonApiDataObject,
    JsonApiPayload
} from 'jsonapi-types';
import Constants from '@constants/shared';

export default class JsonApiResponse implements JsonApiPayload {
    data?: JsonApiData;
    errors?: Array<JsonApiError>;
    meta?: JsonApiMetadata;
    jsonapi?: JsonApiInfo;

    constructor(data?: JsonApiDataObject) {
        this.jsonapi = {
            version: Constants.JsonApi_VERSION
        };
        if (data) {
            this.setData(data);
        }
    }

    setData(data: JsonApiData): void {
        this.data = data;
    }

    addData(data: JsonApiDataObject): void {
        if (!this.data) {
            this.data = [data];
        } else if (Array.isArray(this.data)) {
            this.data.push(data);
        } else {
            this.data = [this.data, data];
        }
    }

    addError(error: JsonApiError): void {
        if (!this.errors) {
            this.errors = [error];
        } else {
            this.errors.push(error);
        }
    }
}
