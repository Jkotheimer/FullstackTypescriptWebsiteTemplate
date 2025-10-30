type GenericObject = { [key: string]: any };
export type JSONAPIMetadata = GenericObject;
export type JSONAPIInfo = {
    version: string;
    ext?: Array<string>;
    profile?: Array<string>;
    meta?: JSONAPIMetadata;
};
export type JSONAPILink = {
    href: string;
    rel?: string;
    title?: string;
    describedby?: string;
    hreflang?: string;
    meta?: JSONAPIMetadata;
};
export type JSONAPILinks = {
    self?: JSONAPILink | string;
    related?: JSONAPILink | string;
    first?: JSONAPILink | string;
    last?: JSONAPILink | string;
    prev?: JSONAPILink | string;
    next?: JSONAPILink | string;
    [key: string]: JSONAPILink | string | undefined;
};
export type JSONAPIDataObject = {
    id: string;
    type: string;
    attributes: GenericObject;
    relationships?: GenericObject;
    meta?: JSONAPIMetadata;
    [key: string]: any;
};
export type JSONAPIData = Array<JSONAPIDataObject> | JSONAPIDataObject;
export type JSONAPIError = {
    id?: string;
    status: string;
    code: string;
    title: string;
    detail: string;
    fields?: Array<String>;
    source?: GenericObject;
    meta?: JSONAPIMetadata;
};
export interface JSONAPIPayload {
    code?: string;
    message?: string;
    data?: JSONAPIData;
    errors?: Array<JSONAPIError>;
    meta?: JSONAPIMetadata;
    jsonapi?: JSONAPIInfo;
}
