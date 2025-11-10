import Constants from '@constants/shared';
import fs from 'fs';
import jwt from 'jsonwebtoken';

const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILE);
const PUBLIC_KEY = fs.readFileSync(process.env.JWT_PUBLIC_KEY_FILE);
const SIGN_OPTIONS: jwt.SignOptions = {
    algorithm: 'RS256',
    expiresIn: Constants.SESSION.DURATION_SECONDS
};
const VERIFY_OPTIONS: jwt.VerifyOptions = {
    algorithms: ['RS256'],
    maxAge: Constants.SESSION.DURATION_SECONDS
};

export default class JWT {
    /**
     * @description Sign a payload and get a JWT
     * @param payload Payload to sign
     * @returns JWT
     */
    public static async sign(payload: jwt.JwtPayload): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            jwt.sign(payload, PRIVATE_KEY, SIGN_OPTIONS, (error, token) => {
                if (error) {
                    reject(error);
                } else if (token) {
                    resolve(token);
                } else {
                    reject(new Error(Constants.ERROR_MESSAGES.UNEXPECTED));
                }
            });
        });
    }

    /**
     * @description Check the validity of a JWT
     * @param token Token to check
     * @returns Valid JWT Payload
     * @throws {Error} If token is invalid
     */
    public static async verify(token: string): Promise<jwt.JwtPayload> {
        return new Promise<jwt.JwtPayload>((resolve, reject) => {
            jwt.verify(token, PUBLIC_KEY, VERIFY_OPTIONS, (error, payload) => {
                if (error) {
                    reject(error);
                } else if (payload) {
                    if (typeof payload === 'string') {
                        try {
                            resolve(JSON.parse(payload) as jwt.JwtPayload);
                        } catch (error) {
                            reject(new Error('Malformed JWT payload:' + payload));
                        }
                    } else {
                        resolve(payload);
                    }
                } else {
                    reject(new Error(Constants.ERROR_MESSAGES.UNEXPECTED));
                }
            });
        });
    }
}
