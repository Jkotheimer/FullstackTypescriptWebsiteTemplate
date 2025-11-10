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

export default async function ensureNodeEnv(defaultEnv?: Environment) {
    if (process.env.NODE_ENV && nodeEnvConfig.enumValues?.has(process.env.NODE_ENV)) {
        return;
    }
    const result = CLIReader.parseArgv([nodeEnvConfig], false);
    if (result.NODE_ENV.value) {
        process.env.NODE_ENV = result.NODE_ENV.value as string;
    } else if (defaultEnv && nodeEnvConfig.enumValues?.has(defaultEnv)) {
        process.env.NODE_ENV = defaultEnv;
    } else {
        if (result.NODE_ENV.error) {
            console.error(result.NODE_ENV.error);
        }
        console.warn('WARNING: NODE_ENV is not set. Please select an environment.');
        process.env.NODE_ENV = (await CLIReader.prompt(nodeEnvConfig)) as Environment;
    }
}
