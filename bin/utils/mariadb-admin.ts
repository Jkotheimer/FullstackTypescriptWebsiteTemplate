import asyncExec, { AsyncExecResponse } from './async-exec.ts';
import { sourceShellConfig, writeShellConfig } from './shell-config.ts';
import CLIReader from './cli-reader.ts';
import mysql from 'mysql2';
import path from 'path';
import fs from 'fs';

const SECRETS_FILE = path.resolve('.secrets');

/**
 * Use this utility to interact with mariadb as an admin
 */
export default class MariaDBAdmin {
    private static rootPassword: string | null;
    private static usingSavedPassword: boolean = false;

    public static getMySqlConfig(): mysql.ConnectionOptions {
        return {
            host: process.env.MYSQL_HOST,
            database: process.env.MYSQL_DATABASE,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD
        } as mysql.ConnectionOptions;
    }

    public static connectAsApplicationUser(): mysql.Connection {
        return mysql.createConnection(MariaDBAdmin.getMySqlConfig());
    }

    public static async isMariaDBRunning(): Promise<boolean> {
        try {
            const pgrepResult = await asyncExec('pgrep mariadb');
            const pid = parseInt(pgrepResult.stdoutLines[0]);
            return !Number.isNaN(pid);
        } catch (error) {
            return false;
        }
    }

    public static mysqlEnvironmentVarsAreSet(): boolean {
        const mysqlConfig = MariaDBAdmin.getMySqlConfig();
        return !!mysqlConfig.host && !!mysqlConfig.database && !!mysqlConfig.user && !!mysqlConfig.password;
    }

    public static ensureMysqlEnvironmentVars(): void {
        if (MariaDBAdmin.mysqlEnvironmentVarsAreSet()) {
            return;
        }
        const dotEnvFile = path.resolve(`.env.${process.env.NODE_ENV}`);
        process.env = {
            ...process.env,
            ...sourceShellConfig(dotEnvFile)
        };
        if (!MariaDBAdmin.mysqlEnvironmentVarsAreSet()) {
            console.error(`MySQL configuration not found in ${dotEnvFile}`);
            console.error('Please run `npm run configure` and try again.');
            process.exit(1);
        }
    }

    public static async getRootPassword() {
        if (MariaDBAdmin.rootPassword?.length) {
            return MariaDBAdmin.rootPassword;
        }
        if (!MariaDBAdmin.usingSavedPassword) {
            const savedSecrets = sourceShellConfig(SECRETS_FILE);
            if (!!savedSecrets.MARIADB_ROOT_PASSWORD?.length) {
                MariaDBAdmin.rootPassword = savedSecrets.MARIADB_ROOT_PASSWORD;
                MariaDBAdmin.usingSavedPassword = true;
                return MariaDBAdmin.rootPassword;
            }
        }
        MariaDBAdmin.rootPassword = (await CLIReader.prompt({
            key: 'rootPassword',
            label: 'MariaDB Root Password',
            type: 'string',
            masked: true
        })) as string;

        const savePassword = (await CLIReader.prompt({
            key: 'savePassword',
            label: 'Save Admin Password Locally?',
            type: 'boolean'
        })) as boolean;
        if (savePassword) {
            writeShellConfig(SECRETS_FILE, { MARIADB_ROOT_PASSWORD: MariaDBAdmin.rootPassword });
        }
        return MariaDBAdmin.rootPassword;
    }

    public static async exec(sqlStatement: string): Promise<AsyncExecResponse> {
        MariaDBAdmin.ensureMysqlEnvironmentVars();
        const mysqlConfig = MariaDBAdmin.getMySqlConfig();
        const tempFileName = `mariadb-${Date.now()}.sql`;
        fs.writeFileSync(tempFileName, sqlStatement);
        const rootPassword = await MariaDBAdmin.getRootPassword();
        try {
            const result = await asyncExec(
                `mariadb --user=root --host=${mysqlConfig.host} --password='${rootPassword}' <<< "$(cat ${tempFileName})"`
            );
            return result;
        } catch (error) {
            if (error instanceof AsyncExecResponse && error.stderr?.includes('Access denied for user')) {
                if (MariaDBAdmin.usingSavedPassword) {
                    console.error(`The mariadb root password saved in ${SECRETS_FILE} is incorrect.`);
                    MariaDBAdmin.usingSavedPassword = false;
                } else {
                    console.error('The provided password is incorrect.');
                }
                MariaDBAdmin.rootPassword = null;
                return new Promise((resolve) => {
                    setTimeout(() => resolve(this.exec(sqlStatement)), 1000);
                });
            }
            throw error;
        } finally {
            fs.rmSync(tempFileName);
        }
    }

    public static async execFromFile(filepath: string, preprocess?: (sql: string) => string) {
        MariaDBAdmin.ensureMysqlEnvironmentVars();
        let sql = MariaDBAdmin.getSQLFromFile(filepath);
        if (preprocess) {
            sql = preprocess(sql);
        }
        return MariaDBAdmin.exec(sql);
    }

    public static getSQLFromFile(filename: string): string {
        if (!fs.existsSync(filename)) {
            throw new Error(`SQL source file not found: ${filename}`);
        }
        const sql = fs.readFileSync(filename).toString().replaceAll('"', '\\"');
        return MariaDBAdmin.replaceTemplateLiterals(sql, MariaDBAdmin.getMySqlConfig() as Record<string, string>);
    }

    public static replaceTemplateLiterals(sql: string, templateData: Record<string, string>): string {
        const keys = Object.keys(templateData);
        const formattedTemplateData = Object.keys(templateData).reduce(
            (data: Record<string, string>, key: string) => {
                if (/{!(\w+)}/.test(key)) {
                    data[key] = templateData[key];
                } else {
                    data[`{!${key}}`] = templateData[key];
                }
                return data;
            },
            {} as Record<string, string>
        );
        Object.keys(formattedTemplateData).forEach((key) => {
            if (!sql.includes(key)) {
                console.log('sql does not contain key', key);
                return;
            }
            const value = formattedTemplateData[key];
            if (!value) {
                throw new Error(
                    `Unable to execute SQL because template literal does not have a matching substitute for configuration key: ${key}.`
                );
            }
            sql = sql.replaceAll(key, value);
        });
        return sql;
    }
}
