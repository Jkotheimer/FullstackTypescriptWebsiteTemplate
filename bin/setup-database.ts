#!/usr/bin/env node
import CLIReader from './cli-reader';
import mysql from 'mysql2';
import path from 'path';
import url from 'url';

export type Environment = 'development' | 'staging' | 'production';

export interface DatabaseSetupArgs {
    NODE_ENV: Environment;
}

const __filename: string = url.fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

export default async function main(): Promise<void> {
    const mysqlConfig: mysql.ConnectionOptions = {
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD
    };
    if (!mysqlConfig.host || !mysqlConfig.database || !mysqlConfig.user || !mysqlConfig.password) {
        console.error('Missing MySQL configuration values from process environment!');
    }
    const connection: mysql.Connection = mysql.createConnection(mysqlConfig);
    console.log('Got connection');
    connection.on('error', async (error) => {
        if (!(error instanceof Error)) {
            console.error(error);
            process.exit(1);
        }
        console.error(error.message);
        if (error.message.startsWith('Access denied for user')) {
            console.log("I can create a user for you using the config in  if you'd like.");
            console.log('Doule check the');
            const userWantsToContinue = (await CLIReader.prompt({
                key: '',
                label: 'Continue?',
                type: 'boolean'
            })) as boolean;
            if (!userWantsToContinue) {
                process.exit(1);
            }
        }
    });
}

if (process.argv[1] === __filename) {
    main();
}
