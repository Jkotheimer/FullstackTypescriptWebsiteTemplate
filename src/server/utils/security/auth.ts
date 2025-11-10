import Constants from '@constants/shared';
import User from '@database/models/user';
import JWT from '@utils/security/jwt';

export default class Auth {
    /**
     * @description Check the validity of a password in accordance with the application policy
     */
    public static preValidatePassword(password?: string): boolean {
        return (
            !!password?.length &&
            password.length >= Constants.CRYPTO.PASSWORD_MIN_LENGTH &&
            password.length <= Constants.CRYPTO.PASSWORD_MAX_LENGTH
        );
    }
    /**
     * @description Get a signed JWT that can be used for anonymous users. Generally used for login.
     * @param clientId Application client that the token may be used from
     * @returns Signed JWT
     */
    public static async issueAnonymousToken(clientId: string): Promise<string> {
        return await JWT.sign({
            iss: process.env.SERVER_HOST_NAME,
            aud: clientId,
            sub: 'Anonymous'
        });
    }

    /**
     * @description Get a signed JWT for an authenticated user session
     * @param user User who started the session
     * @param clientId Application client that the token may be used from
     * @returns Signed JWT
     */
    public static async issueTokenForUser(user: User, clientId: string): Promise<string> {
        return await JWT.sign({
            iss: process.env.SERVER_HOST_NAME,
            aud: clientId,
            sub: user.Email
        });
    }
}
