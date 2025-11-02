#!/usr/bin/env node
import CLIReader, { CLIValueConfig } from './cli-reader.ts';
import sourceShellConfig from './source-shell-config.ts';
import asyncExec from './async-exec.ts';
import mysql from 'mysql2';
import path from 'path';
import url from 'url';
import fs from 'fs';

export type Environment = 'development' | 'staging' | 'production';

export interface DatabaseSetupArgs {
    NODE_ENV: Environment;
}

const DATABASE_ARG_CONFIGS = Object.freeze([
    new CLIValueConfig({
        key: 'NODE_ENV',
        label: 'Environment',
        type: 'enum',
        enumValues: new Set<string>(['development', 'staging', 'production']),
        flags: new Set<string>(['--environment', '--env', '-e']),
        defaultValue: 'development'
    })
]);

const __filename: string = url.fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

function generateMySqlConfig(): mysql.ConnectionOptions {
    return {
        host: process.env.MYSQL_HOST,
        database: process.env.MYSQL_DATABASE,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD
    } as mysql.ConnectionOptions;
}

export default async function main(args: DatabaseSetupArgs): Promise<void> {
    let mysqlConfig: mysql.ConnectionOptions = generateMySqlConfig();
    let dotEnvFile = path.resolve(`.env.${args.NODE_ENV}`);
    let triedDotEnv = false;
    while (!mysqlConfig.host || !mysqlConfig.database || !mysqlConfig.user || !mysqlConfig.password) {
        console.error('Missing MySQL configuration values from process environment!');
        if (fs.existsSync(dotEnvFile) && triedDotEnv) {
            console.error('Change environment?');
            args.NODE_ENV = (await CLIReader.prompt(DATABASE_ARG_CONFIGS[0])) as Environment;
            dotEnvFile = path.resolve(`.env.${args.NODE_ENV}`);
        }
        while (!fs.existsSync(dotEnvFile)) {
            if (!args.NODE_ENV) {
                console.error('NODE_ENV is not set!');
            } else {
                console.error(`Environment variable file not found: ${dotEnvFile}`);
                console.error(
                    'If you have not already, run `npm run configure` to set up your MySQL environment variables.'
                );
                console.log('Alternatively, you may choose a different environment.');
            }
            args.NODE_ENV = (await CLIReader.prompt(DATABASE_ARG_CONFIGS[0])) as Environment;
            dotEnvFile = path.resolve(`.env.${args.NODE_ENV}`);
        }
        process.env = {
            ...process.env,
            ...sourceShellConfig(dotEnvFile)
        };
        mysqlConfig = generateMySqlConfig();
        triedDotEnv = true;
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
            const createUserSqlFile = path.resolve('sql/create-user.sql');
            console.log(
                `I can create a user for you by merging the config in ${dotEnvFile} into ${createUserSqlFile} if you'd like.`
            );
            console.log(
                `Doule check the config in ${dotEnvFile} and the SQL syntax in ${createUserSqlFile} before confirming this action.`
            );
            const userWantsToContinue = (await CLIReader.prompt({
                key: '',
                label: 'Continue?',
                type: 'boolean'
            })) as boolean;
            if (!userWantsToContinue) {
                process.exit(1);
            }
            console.log('Create user sql file:', createUserSqlFile);
            const createUserSql = fs.readFileSync(createUserSqlFile).toString();
            asyncExec(`sudo mariadb`);
        }
    });
}

if (process.argv[1] === __filename) {
    const args = CLIReader.parseArgv(DATABASE_ARG_CONFIGS) as DatabaseSetupArgs;
    main(args);
}
