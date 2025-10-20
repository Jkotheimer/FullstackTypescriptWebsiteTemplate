import BaseModel from '@database/models/base';

export default class URL {
    public static get(record: BaseModel): URL {
        const url = new URL();
        return url;
    }
}
