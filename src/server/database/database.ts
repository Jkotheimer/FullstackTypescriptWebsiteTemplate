import { DatabaseError } from '@database/models/errors';
import BaseModel from '@database/models/base';
import mysql from 'mysql2';
import Constants from '@constants/shared';

export enum BaseAction {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE'
}

export class TransactionError extends Error {
    transactionInitError?: mysql.QueryError;
    commitError?: mysql.QueryError;
    rollbackError?: mysql.QueryError;
}

export default class Database {
    public static connection: mysql.Connection;

    /**
     * Static initializer to initialize database connection
     */
    static {
        Database.connection = mysql.createConnection({
            host: process.env.MYSQL_HOST,
            database: process.env.MYSQL_DATABASE,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD
        });
        Database.connection.on('error', console.error);
    }

    public static checkConnection(): boolean {
        if (!Database.connection.authorized) {
            return false;
        }
        return true;
    }

    /**
     * @description Wrap a function or promise in a SQL transaction
     * @param fn Function to call or promise to await
     * @returns {Promise<any, TransactionError>}
     */
    public static async wrap(fn: Function | Promise<any>): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (!Database.checkConnection()) {
                reject('Database connection is severed. Please check server config');
            }
            Database.connection.beginTransaction(async (transactionInitError: mysql.QueryError | null) => {
                if (transactionInitError) {
                    const error = new TransactionError();
                    error.transactionInitError = transactionInitError;
                    reject(error);
                }
                try {
                    let result;
                    if (fn instanceof Promise) {
                        result = await fn;
                    } else {
                        result = await fn();
                    }
                    Database.connection.commit((commitError) => {
                        if (commitError) {
                            const error = new TransactionError();
                            error.commitError = commitError;
                            Database.connection.rollback((rollbackError) => {
                                if (rollbackError) {
                                    error.rollbackError = rollbackError;
                                }
                                reject(error);
                            });
                        } else {
                            resolve(result);
                        }
                    });
                } catch (exception) {
                    const error = new TransactionError();
                    if (exception instanceof Error) {
                        error.message = exception.message;
                        error.stack = exception.stack;
                    }
                    Database.connection.rollback((rollbackError) => {
                        if (rollbackError) {
                            error.rollbackError = rollbackError;
                        }
                        reject(error);
                    });
                }
            });
        });
    }

    /**
     * @description Execute a SQL query
     * @param query SQL query string
     * @returns Promise that resolves to an array of records resulting from query
     */
    public static async query(query: string, variables: any[] = []): Promise<Array<Record<string, any>>> {
        return new Promise<Array<Record<string, any>>>((resolve, reject) => {
            const formattedQuery = Database.connection.format(query, variables);
            console.log('Formatted Query:', formattedQuery);
            Database.connection.query(formattedQuery, (queryError: mysql.QueryError, result: mysql.RowDataPacket[]) => {
                if (queryError) {
                    reject(new DatabaseError(queryError));
                } else {
                    resolve(result);
                }
            });
        });
    }

    public static async insert(record: BaseModel): Promise<mysql.QueryResult> {
        return new Promise<mysql.QueryResult>(async (resolve, reject) => {
            const table = record.constructor.name;
            const recordClone = await record.createQuerySafeClone();
            const query = mysql.format('INSERT INTO ?? SET ?;', [table, recordClone]);
            console.log(query);
            Database.connection.query(query, (insertError: mysql.QueryError, result: mysql.QueryResult) => {
                if (insertError) {
                    reject(new DatabaseError(insertError));
                } else {
                    resolve(result);
                }
            });
        });
    }

    public static async update(record: BaseModel): Promise<mysql.OkPacket> {
        if (!record?.Id) {
            throw new DatabaseError(Constants.ERROR_MESSAGES.CANNOT_UPDATE_RECORD_WITHOUT_ID);
        }
        const table = record.constructor.name;
        const recordClone = await record.createQuerySafeClone();
        const query = mysql.format('UPDATE ?? SET ? WHERE Id = ?', [table, recordClone, record.Id]);
        console.log(query);
        return new Promise<mysql.OkPacket>((resolve, reject) => {
            Database.connection.query(query, (updateError: mysql.QueryError, result: mysql.OkPacket) => {
                if (updateError) {
                    reject(new DatabaseError(updateError));
                } else {
                    resolve(result);
                }
            });
        });
    }

    public static async delete(record: BaseModel | string): Promise<mysql.OkPacket> {
        const recordId = record instanceof BaseModel ? record.Id : record;
        if (!recordId?.length) {
            throw new DatabaseError(Constants.ERROR_MESSAGES.CANNOT_DELETE_RECORD_WITHOUT_ID);
        }
        const table = record.constructor.name;
        const id = recordId;
        const query = mysql.format('DELETE FROM ?? WHERE Id = ?;', [table, id]);
        console.log(query);
        return new Promise<mysql.OkPacket>((resolve, reject) => {
            Database.connection.query(query, (deleteError: mysql.QueryError, result: mysql.OkPacket) => {
                if (deleteError) {
                    reject(new DatabaseError(deleteError));
                } else {
                    resolve(result);
                }
            });
        });
    }
}
