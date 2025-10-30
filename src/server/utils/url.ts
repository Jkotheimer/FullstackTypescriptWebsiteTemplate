import BaseModel from '@database/models/base';

export default class URLUtils {
    public static get(record: BaseModel): URL {
        const url = new URL(`https://localhost/${record.Id}`);
        return url;
    }
}
