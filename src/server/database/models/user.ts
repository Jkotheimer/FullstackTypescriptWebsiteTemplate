/**
 * User data model representation
 */
import BaseModel from '@database/models/base';

export default class User extends BaseModel {
    public FirstName?: string;
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
    public static from(data: any): User {
        return super.from(data) as User;
    }
}
