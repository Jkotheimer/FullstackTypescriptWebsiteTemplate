import CLIReader, { CLIValueConfig } from './cli-reader.ts';

export type Environment = 'development' | 'staging' | 'production';

export interface NodeEnvArgs {
    NODE_ENV: Environment;
}

const nodeEnvConfig: CLIValueConfig = new CLIValueConfig({
    key: 'NODE_ENV',
    label: 'Environment',
    type: 'enum',
    flags: new Set(['--environment', '--env', '-e']),
    enumValues: new Set(['development', 'staging', 'production']),
    defaultValue: 'development'
});

export default async function ensureNodeEnv() {
    if (!process.env.NODE_ENV) {
        const env = CLIReader.parseArgv([nodeEnvConfig]) as NodeEnvArgs;
        if (env.NODE_ENV) {
            process.env.NODE_ENV;
        } else {
            console.warn('WARNING: NODE_ENV is not set. Please select an environment.');
            process.env.NODE_ENV = (await CLIReader.prompt(nodeEnvConfig)) as Environment;
        }
    }
}
