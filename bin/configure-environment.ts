#!/usr/bin/env node
import CLIReader, { CLIValueConfig } from './cli-reader.ts';
import exec from './async-exec.ts';
import dotenv from 'dotenv';
import path from 'path';
import url from 'url';
import fs from 'fs';

const __filename = url.fileURLToPath(import.meta.url);

/**
 * ----------------------------------------------
 * ------ TYPE DEFS, ENUMS, & CONSTANTS ---------
 * ----------------------------------------------
 */

export type Environment = 'development' | 'staging' | 'production';

export interface ConfigurationArgs {
    NODE_ENV: Environment;
}

export interface EnvironmentVariableConfig {
    name: string;
    label: string;
    default: string;
    masked?: boolean;
}

export interface ApplicationJWTEnvironmentVariables {
    JWT_PRIVATE_KEY_FILE: string;
    JWT_PUBLIC_KEY_FILE: string;
}

export interface ApplicationMySQLEnvironmentVariables {
    MYSQL_DATABASE: string;
    MYSQL_PASSWORD: string;
    MYSQL_HOST: string;
    MYSQL_USER: string;
}

export interface ApplicationEnvrionmentVariables
    extends ApplicationJWTEnvironmentVariables,
        ApplicationMySQLEnvironmentVariables {
    NODE_ENV: Environment;
    LOG_FILE_PATH: string;
}

// These variables will be saved in the .env file once captured from the user
const ENVIRONMENT_VARIABLE_CONFIGS: Readonly<Array<CLIValueConfig>> = Object.freeze([
    new CLIValueConfig({
        key: 'NODE_ENV',
        label: 'Environment',
        type: 'enum',
        flags: new Set(['--environment', '--env', '-e']),
        enumValues: new Set(['development', 'staging', 'production']),
        defaultValue: 'development'
    }),
    new CLIValueConfig({
        key: 'SERVER_HOSTNAME',
        label: 'Server Hostname',
        type: 'string',
        flags: new Set(['--hostname', '-h']),
        defaultValue: 'localhost'
    }),
    new CLIValueConfig({
        key: 'MYSQL_HOST',
        label: 'MySQL Host',
        type: 'string',
        flags: new Set(['--mysql-host']),
        defaultValue: 'localhost'
    }),
    new CLIValueConfig({
        key: 'MYSQL_DATABASE',
        label: 'MySQL Database',
        type: 'string',
        flags: new Set(['--mysql-database']),
        defaultValue: 'typescript_starter_kit'
    }),
    new CLIValueConfig({
        key: 'MYSQL_USER',
        label: 'MySQL User',
        type: 'string',
        flags: new Set(['--mysql-user']),
        defaultValue: 'mysql'
    }),
    new CLIValueConfig({
        key: 'MYSQL_PASSWORD',
        label: 'MySQL Password',
        type: 'string',
        flags: new Set(['--mysql-password']),
        masked: true
    }),
    new CLIValueConfig({
        key: 'LOG_FILE_PATH',
        label: 'Log File Path',
        type: 'string',
        flags: new Set(['--log-file-path', '-l']),
        defaultValue: path.resolve('logs')
    })
] as Array<CLIValueConfig>);

const EMPTY_ENV_VARS: ApplicationEnvrionmentVariables = {
    NODE_ENV: 'development',
    LOG_FILE_PATH: '',
    MYSQL_HOST: '',
    MYSQL_USER: '',
    MYSQL_PASSWORD: '',
    MYSQL_DATABASE: '',
    JWT_PRIVATE_KEY_FILE: '',
    JWT_PUBLIC_KEY_FILE: ''
};

/**
 * ----------------------------------------------
 * -------------- HELPER METHODS ----------------
 * ----------------------------------------------
 */

/**
 * @description When the program is interrupted, print custom information about the state that is being left behind
 * @param {string} draftDotenvFilePath File path to .env.draft
 * @returns {function} Function to clear the interrupt handler
 */
function trapInterrupt(draftDotenvFilePath: string): () => void {
    function onExit(code: number) {
        console.log(`\nConfiguration interrupted. Exiting gracefully with status code ${code}...`);
        if (fs.existsSync(draftDotenvFilePath)) {
            console.log(`\nDraft saved to ${draftDotenvFilePath}\n`);
        }
        process.exit(code);
    }
    process.on('exit', onExit);
    return () => process.removeListener('exit', onExit);
}

/**
 * @returns {Promise<Record<string, string>>} Key file paths indexed by environment variable name
 */
async function generateKeys(): Promise<ApplicationJWTEnvironmentVariables> {
    const JWT_PRIVATE_KEY_FILE = path.resolve('config/.ssl/jwt-rsa.pem');
    const JWT_PUBLIC_KEY_FILE = path.resolve('config/.ssl/jwt-rsa-public.pem');
    if (!fs.existsSync(JWT_PRIVATE_KEY_FILE)) {
        await exec(`openssl genrsa -out ${JWT_PRIVATE_KEY_FILE} 2048`);
        await exec(`openssl rsa -in ${JWT_PRIVATE_KEY_FILE} -outform PEM -pubout -out ${JWT_PUBLIC_KEY_FILE}`);
    }

    return {
        JWT_PRIVATE_KEY_FILE,
        JWT_PUBLIC_KEY_FILE
    };
}

/**
 * ----------------------------------------------
 * --------------- MAIN METHOD ------------------
 * ----------------------------------------------
 */

const isCLI = process.argv[1] === __filename;

/**
 * @description Prompt user for environment variables
 * @param {ConfigurationArgs} args
 */
async function main(args: ConfigurationArgs) {
    if (!args.NODE_ENV) {
        args.NODE_ENV = (await CLIReader.prompt(ENVIRONMENT_VARIABLE_CONFIGS[0])) as Environment;
    }
    const dotenvFileName = `.env.${args.NODE_ENV}`;
    const dotenvFilePath = path.resolve(dotenvFileName);
    const draftDotenvFileName = `${dotenvFileName}.draft`;
    const draftDotenvFilePath = path.resolve(draftDotenvFileName);
    const clearInterrupt = trapInterrupt(draftDotenvFilePath);

    const oldDotenv: ApplicationEnvrionmentVariables = { ...EMPTY_ENV_VARS };
    const draftDotenv: ApplicationEnvrionmentVariables = { ...EMPTY_ENV_VARS };
    try {
        // If an old draft file was found, use it for default value
        if (fs.existsSync(draftDotenvFilePath)) {
            console.log(`Draft dotenv detected [${draftDotenvFileName}]`);
            Object.assign(draftDotenv, dotenv.parse(fs.readFileSync(draftDotenvFilePath)));
        }

        // If an existing dotenv is found, fallback on that for default values
        if (fs.existsSync(dotenvFilePath)) {
            console.log(`Active dotenv detected [${dotenvFileName}]`);
            Object.assign(oldDotenv, dotenv.parse(fs.readFileSync(dotenvFilePath)));
        }

        // Skip the NODE_ENV config because we already confirmed that earlier
        for (const config of ENVIRONMENT_VARIABLE_CONFIGS.slice(1, ENVIRONMENT_VARIABLE_CONFIGS.length)) {
            const key = config.key as keyof ApplicationEnvrionmentVariables;
            config.defaultValue = draftDotenv[key] || oldDotenv[key] || config.defaultValue;
            const value = await CLIReader.prompt(config);
            if (draftDotenv[key] && fs.existsSync(draftDotenvFilePath)) {
                fs.writeFileSync(
                    draftDotenvFilePath,
                    fs
                        .readFileSync(draftDotenvFilePath, 'utf-8')
                        .replace(`${key}='${draftDotenv[key]}'`, `${key}='${value}'`),
                    { encoding: 'utf-8' }
                );
            } else {
                fs.appendFileSync(draftDotenvFilePath, `${key}='${value}'\n`, { encoding: 'utf-8' });
            }
            config.apply(draftDotenv, value);
        }

        const keyFileEnvironmentVariables = await generateKeys();
        Object.keys(keyFileEnvironmentVariables).forEach((envVar) => {
            const keyFilePath = keyFileEnvironmentVariables[envVar as keyof ApplicationJWTEnvironmentVariables];
            fs.appendFileSync(draftDotenvFilePath, `${envVar}='${keyFilePath}'\n`, { encoding: 'utf-8' });
        });

        fs.writeFileSync(dotenvFilePath, fs.readFileSync(draftDotenvFilePath));
        fs.rmSync(draftDotenvFilePath);
    } catch (error) {
        if (isCLI) {
            console.error(error);
        } else {
            throw error;
        }
    } finally {
        clearInterrupt();
    }
}

// If this script was executed directly from the cli, run the main function with cli args.
// Otherwise, this script must have been imported by another script
if (isCLI) {
    const args = CLIReader.parseArgv(ENVIRONMENT_VARIABLE_CONFIGS) as ConfigurationArgs;
    main(args);
}

export default main;
