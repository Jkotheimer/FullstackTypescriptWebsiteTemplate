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
    const args = CLIReader.parseArgv([nodeEnvConfig]) as NodeEnvArgs;
    if (args.NODE_ENV) {
        process.env.NODE_ENV = args.NODE_ENV;
    } else if (defaultEnv && nodeEnvConfig.enumValues?.has(defaultEnv)) {
        process.env.NODE_ENV = defaultEnv;
    } else {
        console.warn('WARNING: NODE_ENV is not set. Please select an environment.');
        process.env.NODE_ENV = (await CLIReader.prompt(nodeEnvConfig)) as Environment;
    }
}
