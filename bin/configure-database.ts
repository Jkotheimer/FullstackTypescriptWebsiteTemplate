#!/usr/bin/env node
import { AsyncExecResponse } from './utils/async-exec.ts';
import Constants from '../src/constants/server.ts';
import MariaDBAdmin from './utils/mariadb-admin.ts';
import ensureNodeEnv from './utils/node-env.ts';
import { randomUUID } from 'crypto';
import path from 'path';
import url from 'url';

const __filename: string = url.fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const SYSTEM_FIELDS = [
    'Id CHAR(63) NOT NULL',
    'CreatedTimestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()',
    'LastModifiedTimestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()'
];

export default async function main(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await ensureNodeEnv();
            MariaDBAdmin.ensureMysqlEnvironmentVars();
            const appSchemaSqlFile = path.resolve('sql/app-schema.sql');
            console.log('Executing SQL in', appSchemaSqlFile);
            await MariaDBAdmin.execFromFile(appSchemaSqlFile, (sql: string) => {
                const lines = sql.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.includes('CREATE TABLE')) {
                        const indent = (line.match(/^ +/)?.join('') ?? '') + '    ';
                        SYSTEM_FIELDS.forEach((field) => lines.splice(++i, 0, indent + field + ','));
                    }
                }
                return lines.join('\n');
            });
            console.log('App schema successfully applied.');
            const createUserSqlFile = path.resolve('sql/create-user.sql');
            console.log('Executing SQL in', createUserSqlFile);
            await MariaDBAdmin.execFromFile(createUserSqlFile);
            const mariadbUser = MariaDBAdmin.getMySqlConfig().user;
            console.log('MariaDB application user successfully created:', mariadbUser);

            const initializeDataSqlFile = path.resolve('sql/initialize-data.sql');
            console.log('Executing SQL in', initializeDataSqlFile);
            await MariaDBAdmin.execFromFile(initializeDataSqlFile, (sql: string) => {
                const uctsInsert = Object.values(Constants.CREDENTIAL_TYPE)
                    .map((uct) => `('uct_${randomUUID()}','${uct}')`)
                    .join(',');
                console.log('uctsInsert', uctsInsert);
                sql = MariaDBAdmin.replaceTemplateLiterals(sql, {
                    user_credential_types: uctsInsert
                });
                return sql;
            });

            // Test connection
            console.log('Testing connection as', mariadbUser);
            const connection = MariaDBAdmin.connectAsApplicationUser();
            connection.on('error', reject);
            connection.on('connect', (res) => {
                console.log('Successful connection!');
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

if (process.argv[1] === __filename) {
    main()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            if (error instanceof AsyncExecResponse) {
                console.error(error.stderr);
            } else if (error instanceof Error) {
                console.error(error.message);
            } else {
                console.error(error);
            }
            process.exit(1);
        });
}
