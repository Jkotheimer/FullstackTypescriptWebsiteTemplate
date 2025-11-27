import BaseModel from '@database/models/base';

export type UserCredentialType = 'password' | 'mfa_key' | 'jwt';

export interface IUserCredential {
    Value?: string;
    UserId?: string;
    Type?: UserCredentialType;
    IsActive?: boolean;
    ExpirationDate?: Date;
}

export default class UserCredential extends BaseModel implements IUserCredential {
    public Value?: string;
    public UserId?: string;
    public Type?: UserCredentialType;
    public IsActive?: boolean;
    public ExpirationDate?: Date;

    public static from(record: IUserCredential): UserCredential {
        return super.from(record);
    }
}
