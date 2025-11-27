import Constants from '@constants/shared';
import StringUtils from '@utils/string';
import GlobalDescribe, { TableDescribe } from '@database/describe';
import { randomUUID } from 'crypto';

export interface IBaseModel {
    Id?: string;
    CreatedTimestamp?: number;
    LastModifiedTimestamp?: number;
}

export default class BaseModel implements IBaseModel {
    public Id?: string;
    public CreatedTimestamp?: number;
    public LastModifiedTimestamp?: number;

    public static readonly READONLY_FIELDS = new Set<string>(['Id', 'CreatedTimestamp', 'LastModifiedTimestamp']);

    /**
     * @description Static factory method to generate a single base model instance
     * @param record Record input to generate model from
     */
    public static from(record: Record<string, any>): BaseModel {
        const tableDescribe = this.getDescribe();
        const model = new this();
        Object.keys(record).forEach((key) => {
            let value = record[key];
            const convertedKey = key.replace(/_x$/, '') as keyof BaseModel;
            const fieldDescribe = tableDescribe.fieldMap[convertedKey];
            if (fieldDescribe) {
                if (fieldDescribe.type === Constants.DB.BOOLEAN_TYPE) {
                    value = typeof value === 'boolean' ? value : value == 1;
                }
            } else if (!this.hasOwnProperty(convertedKey)) {
                throw new Error(StringUtils.format(Constants.ERROR_MESSAGES.INVALID_FIELDS, ['', key]));
            }
            Object.assign(model, { [convertedKey]: value });
        });
        return model;
    }

    public generateId(): string {
        const prefix = this.constructor.name.toLowerCase() + '_';
        this.Id = prefix + randomUUID().replace(/-/g, '');
        return this.Id;
    }

    /**
     * @description Get a describe for this table
     */
    public getDescribe(): TableDescribe {
        return GlobalDescribe.get(this.constructor.name);
    }

    /**
     * @description Get a describe for this table
     */
    public static getDescribe(): TableDescribe {
        return GlobalDescribe.get(this.name);
    }

    /**
     * ------------------------------------------
     * ------------- INSTANCE METHODS -----------
     * ------------------------------------------
     */

    /**
     * @description Clone this instance, but escape the string values of every property to be safe for a SQL query
     */
    public createQuerySafeClone(): BaseModel {
        const clone: Record<string, any> = {};
        const describe = this.getDescribe();
        describe.fields.forEach((field) => {
            let value = this[field.name as keyof BaseModel];
            if (value == null) {
                return;
            }
            if (typeof value === 'string') {
                clone[field.name] = StringUtils.escapeSingleQuotes(value);
            } else {
                clone[field.name] = value;
            }
        });
        return clone as BaseModel;
    }
}
