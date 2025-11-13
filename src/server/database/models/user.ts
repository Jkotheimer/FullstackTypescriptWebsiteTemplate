/**
 * User data model representation
 */
import BaseModel from '@database/models/base';

export interface IUser {
    FirstName?: string;
    LastName?: string;
    Email?: string;
    Phone?: string;
    Password?: string;
    EmailVerified?: boolean;
    IsActive?: boolean;
    ActivatedDate?: Date;
}

export default class User extends BaseModel implements IUser {
    public LastName?: string;
    public Email?: string;
    public Phone?: string;

    // Not an actual field on User table, this is joined in from UserCredential
    public Password?: string;

    // System fields (not writable through user update)
    public EmailVerified?: boolean;
    public IsActive?: boolean;
    public ActivatedDate?: Date;

    public static readonly READONLY_FIELDS: Set<string> = new Set<string>([
        ...Array.from(BaseModel.READONLY_FIELDS),
        'EmailVerified',
        'IsActive',
        'ActivatedDate'
    ]);

    public static readonly HIDDEN_FIELDS: Set<string> = new Set<string>(['Password']);

    /**
     * @description Parse a data object into a user instance
     * @param data The raw untyped user data. Either from a request payload or database query
     */
    public static from(data: IUser): User {
        const password = data.Password;
        delete data.Password;
        const user: User = super.from(data);
        user.Password = password;
        return user;
    }
}
