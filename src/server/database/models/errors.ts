import mysql from 'mysql2';
import Constants from '@constants/shared';

export class RequestError extends Error {
    public errorCode: string;
    public statusCode?: number;
    constructor(errorCode: string, errorMessage: string) {
        super(errorMessage);
        this.errorCode = errorCode;
        if (errorCode in Constants.HTTP_STATUS_CODES) {
            this.statusCode = (Constants.HTTP_STATUS_CODES as any)[errorCode];
        }
    }
}

export class DatabaseError implements mysql.QueryError {
    code: string;
    errno?: number;
    syscall?: string | undefined;
    sqlState?: string | undefined;
    stack?: string | undefined;
    fatal: boolean;
    name: string;
    message: string;

    constructor(error: string | mysql.QueryError) {
        if (typeof error === 'string') {
            this.message = error;
            this.code = Constants.MYSQL_ERROR_CODES.ER_UNKNOWN;
            this.errno = -1;
            this.fatal = true;
            this.name = 'DatabaseError';
        } else {
            this.message = error.message;
            this.code = error.code;
            this.errno = error.errno;
            this.syscall = error.syscall;
            this.sqlState = error.sqlState;
            this.stack = error.stack;
            this.fatal = error.fatal;
            this.name = error.name;
        }
    }
}
