import bcrypt from 'bcryptjs';
import Constants from '@constants';

export default class Crypto {
    public static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(Constants.CRYPTO.HASH_SALT_ROUNDS);
        const hash = await bcrypt.hash(password, salt);
        return Buffer.from(hash).toString(Constants.ENCODING_SCHEME);
    }

    public static async verifyPassword(inputPassword: string, storedPasswordHash: string): Promise<boolean> {
        return await bcrypt.compare(inputPassword, Buffer.from(storedPasswordHash, Constants.ENCODING_SCHEME).toString());
    }
}
