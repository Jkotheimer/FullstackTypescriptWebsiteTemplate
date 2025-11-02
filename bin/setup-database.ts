#!/usr/bin/env node
import mysql from 'mysql2';
import path from 'path';
import url from 'url';

const __filename: string = url.fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

export default async function main(): Promise<void> {
    const connection: mysql.Connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD
    });
    console.log('Got connection');
    connection.on('error', (error) => {
        if (!(error instanceof Error)) {
            console.error(error);
            process.exit(1);
        }
        console.log(error.message);
        if (error.message.startsWith('Access denied for user')) {
        }
    });
}

if (process.argv[1] === __filename) {
    main();
}
