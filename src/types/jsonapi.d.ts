declare module 'jsonapi-types' {
    type GenericObject = { [key: string]: any };
    export type JsonApiMetadata = GenericObject;
    export type JsonApiInfo = {
        version: string;
        ext?: Array<string>;
        profile?: Array<string>;
        meta?: JsonApiMetadata;
    };
    export type JsonApiLink = {
        href: string;
        rel?: string;
        title?: string;
        describedby?: string;
        hreflang?: string;
        meta?: JsonApiMetadata;
    };
    export type JsonApiLinks = {
        self?: JsonApiLink | string;
        related?: JsonApiLink | string;
        first?: JsonApiLink | string;
        last?: JsonApiLink | string;
        prev?: JsonApiLink | string;
        next?: JsonApiLink | string;
        [key: string]: JsonApiLink | string | undefined;
    };
    export type JsonApiDataObject = GenericObject & {
        id?: string;
        type?: string;
        attributes?: GenericObject;
        relationships?: GenericObject;
        meta?: JsonApiMetadata;
    };
    export type JsonApiData = Array<JsonApiDataObject> | JsonApiDataObject;
    export type JsonApiError = {
        id?: string;
        status: string;
        code: string;
        title: string;
        detail: string;
        fields?: Array<String>;
        source?: GenericObject;
        meta?: JsonApiMetadata;
    };
    export interface JsonApiPayload {
        code?: string;
        message?: string;
        data?: JsonApiData;
        errors?: Array<JsonApiError>;
        meta?: JsonApiMetadata;
        jsonapi?: JsonApiInfo;
    }
}
