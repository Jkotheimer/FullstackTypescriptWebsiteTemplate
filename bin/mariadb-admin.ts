import asyncExec, { AsyncExecResponse } from './async-exec.ts';
import sourceShellConfig from './source-shell-config.ts';
import CLIReader from './cli-reader.ts';
import mysql from 'mysql2';
import path from 'path';
import fs from 'fs';

/**
 * Use this utility to interact with mariadb as an admin
 */
export default class MariaDBAdmin {
    private static rootPassword: string;

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
        MariaDBAdmin.rootPassword = (await CLIReader.prompt({
            key: 'rootPassword',
            label: 'MariaDB Root Password',
            type: 'string',
            masked: true
        })) as string;
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
            throw error;
        } finally {
            fs.rmSync(tempFileName);
        }
    }

    public static async execFromFile(filepath: string) {
        MariaDBAdmin.ensureMysqlEnvironmentVars();
        return MariaDBAdmin.exec(MariaDBAdmin.getSQLFromFile(filepath));
    }

    public static getSQLFromFile(filename: string): string {
        if (!fs.existsSync(filename)) {
            throw new Error(`SQL source file not found: ${filename}`);
        }
        const sql = fs.readFileSync(filename).toString().replaceAll('"', '\\"');
        return MariaDBAdmin.replaceTemplateLiterals(sql);
    }

    public static replaceTemplateLiterals(sql: string) {
        const mysqlConfig = MariaDBAdmin.getMySqlConfig();
        Object.keys(mysqlConfig).forEach((key) => {
            const templateLiteral = `{tsk_${key}}`;
            if (sql.includes(templateLiteral)) {
                const value = mysqlConfig[key as keyof mysql.ConnectionOptions];
                if (!value) {
                    throw new Error(
                        `Unable to execute SQL because template literal does not have a matching substitute for configuration key: ${key}.`
                    );
                }
                sql = sql.replaceAll(templateLiteral, value);
            }
        });
        return sql;
    }
}
