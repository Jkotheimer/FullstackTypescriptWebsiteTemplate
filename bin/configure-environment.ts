#!/usr/bin/env node
import parseArgs from './parse-args.ts';
import exec from './async-exec.ts';
import readline from 'readline';
import dotenv from 'dotenv';
import path from 'path';
import url from 'url';
import fs from 'fs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ----------------------------------------------
 * ------ TYPE DEFS, ENUMS, & CONSTANTS ---------
 * ----------------------------------------------
 */

export type Environment = 'development' | 'staging' | 'production';

export interface ConfigurationArgs {
    environment: Environment;
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
    LOG_FILE_PATH: string;
}

// These type declarations are not included in the standard typescript lib
interface ExtendedReadlineInterface extends readline.Interface {
    _writeToOutput: (str: string) => void;
    output: {
        write: (str: string) => void;
    };
}

const ENVIRONMENT_VARIABLE_CONFIGS: Readonly<Array<EnvironmentVariableConfig>> = Object.freeze([
    {
        name: 'SERVER_HOSTNAME',
        label: 'Server Hostname',
        default: 'localhost'
    },
    {
        name: 'MYSQL_HOST',
        label: 'MySQL Host',
        default: 'localhost'
    },
    {
        name: 'MYSQL_DATABASE',
        label: 'MySQL Database',
        default: 'typescript_starter_kit'
    },
    {
        name: 'MYSQL_USER',
        label: 'MySQL User',
        default: 'mysql'
    },
    {
        name: 'MYSQL_PASSWORD',
        label: 'MySQL Password',
        masked: true
    },
    {
        name: 'LOG_FILE_PATH',
        label: 'Log File Path',
        default: path.resolve('logs')
    }
] as Array<EnvironmentVariableConfig>);

const EMPTY_ENV_VARS: ApplicationEnvrionmentVariables = {
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
 * @description Prompt the user for environment variable value
 * @param {EnvironmentVariableConfig} config
 * @param {string} defaultValue
 */
async function captureEnvironmentVariable(config: EnvironmentVariableConfig, defaultValue: string): Promise<string> {
    return new Promise((resolve, reject) => {
        defaultValue = defaultValue || config.default;
        const defaultPrompt = defaultValue
            ? ` (default=${config.masked ? defaultValue.replace(/./g, '*') : defaultValue})`
            : '';
        const rli = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        }) as ExtendedReadlineInterface;
        const prompt = `${config.label}${defaultPrompt}: `;
        rli.question(prompt, (result) => {
            if (config.masked) {
                rli.output.write('\n');
            }
            rli.close();
            const response = result || defaultValue;
            if (!response?.length) {
                resolve(captureEnvironmentVariable(config, defaultValue));
            } else {
                resolve(response);
            }
        });
        if (config.masked) {
            rli._writeToOutput = (str: string) => {
                if (str.startsWith(prompt)) {
                    rli.output.write(prompt);
                    str = str.replace(prompt, '');
                }
                for (let i = 0; i < str.length; i++) {
                    if (str.charCodeAt(i) >= 32) {
                        rli.output.write('*');
                    }
                }
            };
        }
    });
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

/**
 * @description Prompt user for environment variables
 * @param {ConfigurationArgs} args
 */
async function main(args: ConfigurationArgs) {
    const dotenvFileName = `.env.${args.environment}`;
    const dotenvFilePath = path.resolve(dotenvFileName);
    const draftDotenvFileName = `${dotenvFileName}.draft`;
    const draftDotenvFilePath = path.resolve(draftDotenvFileName);

    const oldDotenv: ApplicationEnvrionmentVariables = { ...EMPTY_ENV_VARS };
    const draftDotenv: ApplicationEnvrionmentVariables = { ...EMPTY_ENV_VARS };

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

    const clearInterrupt = trapInterrupt(draftDotenvFilePath);

    for (const config of ENVIRONMENT_VARIABLE_CONFIGS) {
        const key = config.name as keyof ApplicationEnvrionmentVariables;
        const defaultValue = draftDotenv[key] ?? oldDotenv[key] ?? config.default;
        const value = await captureEnvironmentVariable(config, defaultValue);
        if (draftDotenv[key]) {
            fs.writeFileSync(
                draftDotenvFilePath,
                fs
                    .readFileSync(draftDotenvFilePath, 'utf-8')
                    .replace(`${config.name}='${draftDotenv[key]}'`, `${config.name}='${value}'`),
                { encoding: 'utf-8' }
            );
        } else {
            fs.appendFileSync(draftDotenvFilePath, `${config.name}='${value}'\n`, { encoding: 'utf-8' });
        }
        draftDotenv[key] = value;
    }

    const keyFileEnvironmentVariables = await generateKeys();
    Object.keys(keyFileEnvironmentVariables).forEach((envVar) => {
        const keyFilePath = keyFileEnvironmentVariables[envVar as keyof ApplicationJWTEnvironmentVariables];
        fs.appendFileSync(draftDotenvFilePath, `${envVar}='${keyFilePath}'\n`, { encoding: 'utf-8' });
    });

    fs.writeFileSync(dotenvFilePath, fs.readFileSync(draftDotenvFilePath));
    fs.rmSync(draftDotenvFilePath);
    clearInterrupt();
}

// If this script was executed directly from the cli, run the main function with cli args.
// Otherwise, this script must have been imported by another script
if (process.argv[1] === __filename) {
    const args: Record<string, any> = {};
    parseArgs(
        [
            {
                key: 'environment',
                label: 'Environment',
                type: 'enum',
                flags: new Set(['--environment', '--env', '-e']),
                enumValues: new Set(['development', 'staging', 'production']),
                defaultValue: 'development'
            }
        ],
        args
    );
    main(args as ConfigurationArgs);
}

export default main;
