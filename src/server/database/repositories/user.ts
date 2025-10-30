import { DatabaseError, RequestError } from '@database/models/errors';
import Database, { BaseAction } from '@database/database';
import Constants from '@constants/shared';
import User from '@database/models/user';
import Crypto from '@utils/security/crypto';
import StringUtils from '@utils/string';
import Utils from '@utils/utils';
import { FieldDescribe } from '@database/describe';

// User specific actions, which will extend BaseAction
enum _UserAction {
    AUTH = 'AUTH'
}

export const UserAction = { ..._UserAction, ...BaseAction };

/**
 * Allowed fields in the request payload per operation/action.
 * Required fields are determined by database schema, evaluated by table describe
 */
export const UserFieldsByAction: Record<keyof typeof UserAction, Set<string>> = {
    [UserAction.AUTH]: new Set(['Email', 'Password']),
    [UserAction.CREATE]: new Set(['FirstName', 'LastName', 'Email', 'Phone', 'Password']),
    [UserAction.READ]: new Set([
        'Id',
        'FirstName',
        'LastName',
        'Email',
        'Phone',
        'Role',
        'IsActive',
        'CreatedDate',
        'EmailVerified',
        'LastModifiedDate',
        'ActivatedDate'
    ]),
    [UserAction.UPDATE]: new Set(['Id', 'FirstName', 'LastName', 'Phone']),
    [UserAction.DELETE]: new Set()
};

export default class UserRepository {
    /**
     * @description Get the describes for all of the fields that are allowed for the specified action
     * @param action The action to get field describes for
     * @returns List of field describes that are allowed for the specified action
     */
    public static async getFieldDescribesFor(action: keyof typeof UserAction): Promise<Array<FieldDescribe>> {
        const describe = await User.getDescribe();
        const allowedFields = UserFieldsByAction[action];
        return describe.fields.filter((field) => allowedFields.has(field.name));
    }

    /**
     * @description Get a user record for authentication purposes
     * @param email User email to match on
     * @returns User object with Id, Email, and Password fields
     */
    public static async getUserForAuthentication(email: string): Promise<User> {
        const query = Database.connection.format(`SELECT Id, Email, Password FROM User WHERE Email = ? LIMIT 1;`, [
            email
        ]);
        const userRecords = await Database.query(query);
        if (!userRecords.length) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.USER_NOT_FOUND, ['email']);
            throw new RequestError(Constants.ERROR_CODES.NOT_FOUND, errorMessage);
        }
        const user = await User.from(userRecords[0]);
        console.log(user);
        return user;
    }

    /**
     * @description Get a user record by Id with only client-visible fields
     * @param id User Id
     * @returns User object with client-visible fields
     */
    public static async getUserDetails(id: string): Promise<User> {
        const fields = await this.getFieldDescribesFor(UserAction.READ);
        const userRecords = await Database.query(
            `SELECT ${fields.map((field) => field.name).join(',')} FROM User WHERE Id = ? LIMIT 1;`,
            [id]
        );
        if (!userRecords.length) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.USER_NOT_FOUND, ['id']);
            throw new RequestError(Constants.ERROR_CODES.NOT_FOUND, errorMessage);
        }
        console.log('User Record:', userRecords);
        const user = await User.from(userRecords[0]);
        console.log(user);
        return user;
    }

    /**
     * @description Create a new user record
     * @param user User object to create
     * @returns The created user object with a unique Id
     */
    public static async createUser(user: User): Promise<User> {
        const fields = await this.getFieldDescribesFor(UserAction.CREATE);
        Utils.validateFields(user, fields);
        try {
            user.Password = await Crypto.hashPassword(user.Password!);

            // Insert the user record, apply the new record id, and clear out the password before returning the new user record
            //const result = await Database.insert(user);

            // TODO : Figure this out
            //user.Id = result.insertId.toString();
            user.Password = undefined;

            return user;
        } catch (error) {
            if (error instanceof DatabaseError) {
                // Override default MySQL error messages with more user-friendly custom error messages
                switch (error.code) {
                    case Constants.MYSQL_ERROR_CODES.ER_DUP_ENTRY:
                        error.message = Constants.ERROR_MESSAGES.USER_ALREADY_EXISTS;
                    default:
                        break;
                }
            }
            throw error;
        }
    }

    /**
     * @description Update a user record
     * @param user User record to update. Must include Id field. Cannot include fields that are not updateable.
     * @returns The updated user record
     */
    public static async updateUser(user: User): Promise<User> {
        const fields = await this.getFieldDescribesFor(UserAction.UPDATE);
        Utils.validateFields(user, fields);

        const result = await Database.update(user);
        if (result.affectedRows === 0) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.USER_NOT_FOUND, ['id']);
            throw new RequestError(Constants.ERROR_CODES.NOT_FOUND, errorMessage);
        }
        return user;
    }

    public static async deleteUser(userId: string): Promise<User> {
        const user = new User();
        user.Id = userId;
        const result = await Database.delete(user);
        console.log('DELETE RESULT:', result);
        return user;
    }

    public static async deactivateUser(userId: string): Promise<User> {
        const user = await User.from({
            Id: userId,
            IsActive: false
        });
        const result = await Database.update(user);
        if (result.affectedRows === 0) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.USER_NOT_FOUND, ['id']);
            throw new RequestError(Constants.ERROR_CODES.NOT_FOUND, errorMessage);
        }
        return user;
    }
}
