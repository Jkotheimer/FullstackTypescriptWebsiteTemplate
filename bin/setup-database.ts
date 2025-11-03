#!/usr/bin/env node
import { AsyncExecResponse } from './async-exec.ts';
import MariaDBAdmin from './mariadb-admin.ts';
import ensureNodeEnv from './node-env.ts';
import path from 'path';
import url from 'url';

const __filename: string = url.fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

export default async function main(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        try {
            await ensureNodeEnv();
            MariaDBAdmin.ensureMysqlEnvironmentVars();
            const appSchemaSqlFile = path.resolve('sql/app-schema.sql');
            console.log('Executing SQL in', appSchemaSqlFile);
            await MariaDBAdmin.execFromFile(appSchemaSqlFile);
            console.log('App schema successfully applied.');
            const createUserSqlFile = path.resolve('sql/create-user.sql');
            console.log('Executing SQL in', createUserSqlFile);
            await MariaDBAdmin.execFromFile(createUserSqlFile);
            const mariadbUser = MariaDBAdmin.getMySqlConfig().user;
            console.log('MariaDB application user successfully created:', mariadbUser);

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
