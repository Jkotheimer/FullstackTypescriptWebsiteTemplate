import User from '@database/models/user';
import JWT from '@utils/security/jwt';

export default class Auth {
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
