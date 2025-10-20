/**
 * User data model representation
 */
import BaseModel from '@database/models/base';

export default class User extends BaseModel {
    public Id?: string;
    public FirstName?: string;
    public LastName?: string;
    public Email?: string;
    public Phone?: string;
    public Role?: string;
    public Password?: string;
    public IsActive?: boolean;
    public EmailVerified?: boolean;
    public CreatedDate?: Date;
    public LastModifiedDate?: Date;
    public ActivatedDate?: Date;

    /**
     * @description Parse a data object into a user instance
     * @param data The raw untyped user data. Either from a request payload or database query
     */
    public static async from(data: any): Promise<User> {
        return (await super.from(data)) as User;
    }
}
