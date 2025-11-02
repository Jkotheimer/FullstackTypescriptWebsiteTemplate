export type ArgConfigType = string & ('enum' | 'string' | 'number' | 'boolean');
export type ArgValue = string | number | boolean;
export interface ArgConfig {
    key: string;
    label: string;
    required?: boolean;
    type: ArgConfigType;
    flags: Set<string>;
    enumValues: Set<string>;
    defaultValue: ArgValue;
}

/**
 * @param {Array<ArgConfig>} configs
 * @return {ArgParseResponse}
 */
export default function parseCLIArgs(configs: Array<ArgConfig>, obj: object): void {
    if (!Array.isArray(configs)) {
        throw new Error('Configs input must be an array.');
    }
    const duplicateFlags: Record<string, Array<ArgConfig>> = {};
    const configByArgFlags: Record<string, ArgConfig> = configs.reduce(
        (configByArgFlags, config) => {
            if (!config.flags?.size) {
                throw new Error(`Argument config has no flags: ${config.label || config.key}`);
            }
            for (const flag of config.flags) {
                if (!configByArgFlags[flag]) {
                    configByArgFlags[flag] = config;
                } else if (!duplicateFlags[flag]) {
                    duplicateFlags[flag] = [config];
                } else {
                    duplicateFlags[flag].push(config);
                }
            }
            return configByArgFlags;
        },
        {} as Record<string, ArgConfig>
    );

    // If there are any duplicate flags in the provided config, tack on an error
    if (Object.keys(duplicateFlags).length) {
        const message = Object.keys(duplicateFlags).reduce(
            (msg, flag) => msg + ` ([${flag}]=>${duplicateFlags[flag].map((config) => config.key).join(',')})`,
            'Duplicate flag configurations detected:'
        );
        throw new Error(message);
    }

    const errors: Array<string> = [];

    const args: Record<string, ArgValue> = {};
    for (let i = 2; i < process.argv.length; i++) {
        const splitArg: Array<string> = process.argv[i].split('=');
        const flag: string = splitArg[0];
        const config: ArgConfig = configByArgFlags[flag];
        if (!config) {
            errors.push(`Invalid argument: ${flag}`);
            continue;
        }
        const key: string = config.key;
        const label: string = config.label || config.key;
        let value: ArgValue = splitArg.slice(1, splitArg.length).join('');
        if (!value.length) {
            if (i >= process.argv.length || configByArgFlags[process.argv[i + 1]]) {
                if (config.type === 'boolean') {
                    value = true;
                } else {
                    errors.push(`Value required for ${flag} (${label})`);
                    continue;
                }
            } else {
                value = process.argv[++i] as ArgValue;
            }
        }
        switch (config.type) {
            case 'string':
                args[key] = value;
                break;
            case 'number':
                args[key] = parseFloat(value as string);
                if (Number.isNaN(args[key])) {
                    errors.push(`Invalid number provided for ${label}: ${args[key]}`);
                }
                break;
            case 'boolean':
                if (typeof value === 'boolean') {
                    args[key] = value;
                } else if (typeof value === 'number') {
                    args[key] = !!value;
                } else if (value.toLowerCase() === 'true') {
                    args[key] = true;
                } else if (value.toLowerCase() === 'false') {
                    args[key] = false;
                } else {
                    errors.push(`Invalid boolean provided for ${label}: ${value}`);
                }
                break;
            case 'enum':
                if (typeof value !== 'string' || !config.enumValues.has(value)) {
                    const allowedValues = Array.from(config.enumValues).join(',');
                    errors.push(
                        `Invalid value provided for ${label}: "${args[key]}". Allowed values: [${allowedValues}]`
                    );
                } else {
                    args[key] = value;
                }
                break;
            default:
                errors.push(`Invalid argument config type: ${config.type}`);
        }
    }
    configs.forEach((config) => {
        if (args[config.key] == null) {
            if (config.defaultValue != null) {
                args[config.key] = config.defaultValue;
            } else if (config.required) {
                errors.push(`Missing required argument: ${config.label}. [${Array.from(config.flags).join(',')}]`);
            } else if (config.type === 'boolean') {
                args[config.key] = false;
            }
        }
    });
    Object.assign(obj, args);
    if (errors.length) {
        throw new Error(errors.join('\n'));
    }
}
