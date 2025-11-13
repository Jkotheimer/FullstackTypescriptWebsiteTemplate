import { DatabaseError, RequestError } from '@database/models/errors';
import Database from '@database/database';
import Constants from '@constants/shared';
import ServerConstants from '@constants/server';
import User from '@database/models/user';
import Crypto from '@utils/security/crypto';
import StringUtils from '@utils/string';
import AuthUtils from '@utils/security/auth';
import Utils from '@utils/utils';
import UserCredential from '@database/models/user-credential';

export default class UserRepository {
    /**
     * @description Get a user record for authentication purposes
     * @param email User email to match on
     */
    public static async getUserForAuthentication(email: string): Promise<User> {
        const userRecords = await Database.query(
            `SELECT Id, UserCredential.Password FROM User
            LEFT JOIN UserCredential ON User.Id = UserCredential.UserId
            WHERE UserCredential.Type = 'password'
                AND UserCredential.IsActive = true
                AND Email = ?
            LIMIT 1;`,
            [email]
        );
        if (!userRecords.length) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.USER_NOT_FOUND, ['email', email]);
            throw new RequestError(Constants.ERROR_CODES.NOT_FOUND, errorMessage);
        }
        console.log(userRecords[0]);
        const user = User.from(userRecords[0]);
        console.log(user);
        return user;
    }

    /**
     * @description Get a user record by Id with only client-visible fields
     * @param id User Id
     * @returns User object with client-visible fields
     */
    public static async getUserDetails(id: string): Promise<User> {
        const fields = User.getDescribe()
            .fields.filter((field) => !User.HIDDEN_FIELDS.has(field.name))
            .map((field) => field.name)
            .join(',');
        const userRecords = await Database.query(`SELECT ${fields} FROM User WHERE Id = ? LIMIT 1;`, [id]);
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
     */
    public static async createUser(user: User): Promise<string> {
        console.log('User:', user);
        const createbleFields = User.getDescribe().fields.filter((field) => !User.READONLY_FIELDS.has(field.name));

        // Password is not a field on the User table, it is validated separately
        const password = user.Password;
        delete user.Password;

        // Validate regular fields first, then password last
        Utils.validateFields(user, createbleFields);
        if (!password || !AuthUtils.preValidatePassword(password)) {
            console.log('invalid password:', password);
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, Constants.ERROR_MESSAGES.MALFORMED_PASSWORD);
        }

        try {
            // Insert the user record and return the record with it's new id
            return await Database.wrap(async () => {
                const result = await Database.insert(user);
                user.Id = result.insertId;
                const hashedPassword = await Crypto.hashPassword(password);
                const userCredential = UserCredential.from({
                    UserId: user.Id,
                    Value: hashedPassword,
                    Type: 'password',
                    ExpirationDate: new Date(Date.now() + ServerConstants.PASSWORD_TTL),
                    IsActive: true
                });
                await Database.insert(userCredential);
                return result.insertId;
            });
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
        const fields = User.getDescribe().fields.filter((field) => !User.READONLY_FIELDS.has(field.name));
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
        const user = User.from({
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
