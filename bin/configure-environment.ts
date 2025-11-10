#!/usr/bin/env node
import CLIReader, { CLIValueConfig, type CLIValue, type CLIValueParseResult } from './utils/cli-reader.ts';
import ensureNodeEnv from './utils/node-env.ts';
import asyncExec from './utils/async-exec.ts';
import dotenv from 'dotenv';
import path from 'path';
import url from 'url';
import fs from 'fs';

/**
 * ----------------------------------------------
 * ------ TYPE DEFS, ENUMS, & CONSTANTS ---------
 * ----------------------------------------------
 */

export interface EnvironmentVariableConfig {
    name: string;
    label: string;
    default: string;
    masked?: boolean;
}

export interface ApplicationJWTEnvironmentVariables {
    JWT_CURVE: string;
    JWT_PRIVATE_KEY_FILE: string;
    JWT_PUBLIC_KEY_FILE: string;
}

export interface ApplicationSecretsEnvionmentVariables {
    SESSION_SECRET: string;
}

export interface ApplicationMySQLEnvironmentVariables {
    MYSQL_DATABASE: string;
    MYSQL_PASSWORD: string;
    MYSQL_HOST: string;
    MYSQL_USER: string;
}

export interface ApplicationEnvrionmentVariables
    extends ApplicationJWTEnvironmentVariables,
        ApplicationSecretsEnvionmentVariables,
        ApplicationMySQLEnvironmentVariables {
    LOG_FILE_PATH: string;
}

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.resolve('dist');
const SECRETS_DIR = path.resolve(OUT_DIR, '.private');

// Leaving these hardcoded since the paths of these files is arbitrary
const JWT_PRIVATE_KEY_FILE = path.resolve(SECRETS_DIR, 'jwt/private-key.pem');
const JWT_PUBLIC_KEY_FILE = path.resolve(SECRETS_DIR, 'jwt/public-key.pem');

const JWT_CURVE_ENV_CONFIG = new CLIValueConfig({
    key: 'JWT_CURVE',
    label: 'JWT Elliptical Curve Algorithm',
    type: 'enum',
    flags: new Set(['--jwt-curve']),
    defaultValue: 'secp256k1'
});

// These variables will be saved in the .env file once captured from the user
const ENVIRONMENT_VARIABLE_CONFIGS: Readonly<Array<CLIValueConfig>> = Object.freeze([
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
        defaultValue: 'tsk_app'
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
        defaultValue: path.resolve(OUT_DIR, 'logs')
    }),
    JWT_CURVE_ENV_CONFIG
] as Array<CLIValueConfig>);

const EMPTY_ENV_VARS: ApplicationEnvrionmentVariables = {
    LOG_FILE_PATH: '',
    MYSQL_HOST: '',
    MYSQL_USER: '',
    MYSQL_PASSWORD: '',
    MYSQL_DATABASE: '',
    JWT_CURVE: '',
    JWT_PRIVATE_KEY_FILE: '',
    JWT_PUBLIC_KEY_FILE: '',
    SESSION_SECRET: ''
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
function trapInterrupt(draftDotenvFilePath?: string): () => void {
    function onExit(code: number) {
        console.log(`\nConfiguration interrupted. Exiting gracefully with status code ${code}...`);
        if (draftDotenvFilePath && fs.existsSync(draftDotenvFilePath)) {
            console.log(`\nDraft saved to ${draftDotenvFilePath}\n`);
        }
        process.exit(code);
    }
    process.on('exit', onExit);
    return () => process.removeListener('exit', onExit);
}

/**
 * @description Since the available elliptical curve algorithms are dependent on openssl,
 * we need to fetch them separately and apply them to the cli arg config before parsing cli args
 */
async function fetchAvailableJwtCurves() {
    JWT_CURVE_ENV_CONFIG.enumValues = new Set(
        (await asyncExec('openssl ecparam -list_curves')).stdoutLines
            .map((line) => line.split(':')[0].trim())
            .filter((line) => !!line && !line.includes(' '))
    );
}

/**
 * ----------------------------------------------
 * --------------- MAIN METHOD ------------------
 * ----------------------------------------------
 */

const isCLI = process.argv[1] === __filename;

/**
 * @description Prompt user for environment variables
 */
async function main() {
    let clearInterrupt = trapInterrupt();
    try {
        await fetchAvailableJwtCurves();

        // Grab any values that mey have been passed in as cli args
        const args = CLIReader.parseArgv(ENVIRONMENT_VARIABLE_CONFIGS, true, false);

        // Ensure that process.env.NODE_ENV is set
        await ensureNodeEnv();

        // Define .env file paths
        const dotenvFileName = `.env.${process.env.NODE_ENV}`;
        const dotenvFilePath = path.resolve(dotenvFileName);
        const draftDotenvFileName = `${dotenvFileName}.draft`;
        const draftDotenvFilePath = path.resolve(draftDotenvFileName);

        // Reset the ctrl+c interrupt handler to log the draft .env file path
        clearInterrupt();
        clearInterrupt = trapInterrupt(draftDotenvFilePath);

        // Helper method for writing a variable to the draft .env file
        const writeVariableToDraftFile = (key: keyof ApplicationEnvrionmentVariables, value: CLIValue) => {
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
        };

        const oldDotenv: ApplicationEnvrionmentVariables = { ...EMPTY_ENV_VARS };
        const draftDotenv: ApplicationEnvrionmentVariables = { ...EMPTY_ENV_VARS };

        // If an existing dotenv is found, fallback on that for default values
        if (fs.existsSync(dotenvFilePath)) {
            console.log(`Active dotenv detected [${dotenvFileName}]`);
            Object.assign(oldDotenv, dotenv.parse(fs.readFileSync(dotenvFilePath)));
        }

        // If an old draft file was found, use it for default value
        if (fs.existsSync(draftDotenvFilePath)) {
            console.log(`Draft dotenv detected [${draftDotenvFileName}]`);
            Object.assign(draftDotenv, dotenv.parse(fs.readFileSync(draftDotenvFilePath)));
        }

        // Capture environment variable values from cli input
        // If a value was already provided as an argument, the user is not prompted
        for (const config of ENVIRONMENT_VARIABLE_CONFIGS) {
            const key = config.key as keyof ApplicationEnvrionmentVariables;
            let value = args[key];
            if (value == null) {
                config.defaultValue = draftDotenv[key] || oldDotenv[key] || config.defaultValue;
                value = await CLIReader.prompt(config);
            }
            writeVariableToDraftFile(key, value);
            config.apply(draftDotenv, value);
        }

        // Generate JWT Secrets and apply file paths to env
        if (!fs.existsSync(JWT_PRIVATE_KEY_FILE)) {
            console.log('Checking existence of ', path.dirname(JWT_PRIVATE_KEY_FILE));
            if (!fs.existsSync(path.dirname(JWT_PRIVATE_KEY_FILE))) {
                fs.mkdirSync(path.dirname(JWT_PRIVATE_KEY_FILE), { recursive: true });
            }
            await asyncExec(
                `openssl ecparam -name ${draftDotenv.JWT_CURVE} -genkey -noout -outform PEM -out ${JWT_PRIVATE_KEY_FILE}`
            );
            await asyncExec(`openssl ec -in ${JWT_PRIVATE_KEY_FILE} -pubout -outform PEM -out ${JWT_PUBLIC_KEY_FILE}`);
        }
        writeVariableToDraftFile('JWT_PRIVATE_KEY_FILE', JWT_PRIVATE_KEY_FILE);
        writeVariableToDraftFile('JWT_PUBLIC_KEY_FILE', JWT_PUBLIC_KEY_FILE);

        // If session secret is not already set, generate one and set it
        let sessionSecret = draftDotenv.SESSION_SECRET || oldDotenv.SESSION_SECRET;
        if (!sessionSecret?.length) {
            const sessionSecretResponse = await asyncExec(
                `openssl ecparam -name ${draftDotenv.JWT_CURVE} -genkey -noout -outform DER | xxd -ps -u | tr -d "\n"`
            );
            sessionSecret = sessionSecretResponse.stdoutLines[0];
        }
        writeVariableToDraftFile('SESSION_SECRET', sessionSecret);

        fs.writeFileSync(dotenvFilePath, fs.readFileSync(draftDotenvFilePath));
        fs.rmSync(draftDotenvFilePath);
        console.log(`Environment variables saved to ${dotenvFilePath}`);
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
    main();
}

export default main;
