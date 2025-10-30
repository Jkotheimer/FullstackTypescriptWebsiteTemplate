/**
 * @typedef {('enum'|'string'|'number'|'boolean')} ArgConfigType
 */

/**
 * @typedef {(string|number|boolean)} ArgValue
 */

/**
 * @typedef {Object} ArgConfig
 * @property {string} key
 * @property {string?} label
 * @property {boolean} required
 * @property {ArgConfigType} type
 * @property {Set<string>} flags
 * @property {Set<string>?} enumValues
 * @property {ArgValue} defaultValue
 */

/**
 * @typedef {Object} ArgParseResponse
 * @property {Record<string, ArgValue>} args
 * @property {Array<string>} errors
 */

/**
 * @param {Array<ArgConfig>} configs
 * @return {ArgParseResponse}
 */
export default function parseCLIArgs(configs) {
    if (!Array.isArray(configs)) {
        throw new Error('Configs input must be an array.');
    }
    /** @type {Record<string, Array<ArgConfig>>} */
    const duplicateFlags = {};
    /** @type {Record<string, ArgConfig>} */
    const configByArgFlags = configs.reduce((configByArgFlags, config) => {
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
    }, {});

    // If there are any duplicate flags in the provided config, tack on an error
    if (Object.keys(duplicateFlags).length) {
        const message = Object.keys(duplicateFlags).reduce(
            (msg, flag) => msg + ` ([${flag}]=>${duplicateFlags[flag].map((config) => config.key).join(',')})`,
            'Duplicate flag configurations detected:'
        );
        throw new Error(message);
    }

    /** @type {Array<string>} */
    const errors = [];

    /** @type {Record<string, ArgValue>} */
    const args = {};
    for (let i = 2; i < process.argv.length; i++) {
        const splitArg = process.argv[i].split('=');
        const flag = splitArg[0];
        const config = configByArgFlags[flag];
        if (!config) {
            errors.push(`Invalid argument: ${flag}`);
            continue;
        }
        const key = config.key;
        const label = config.label || config.key;
        let value = splitArg.slice(1, splitArg.length).join('');
        if (!value.length) {
            if (i >= process.argv.length || configByArgFlags[process.argv[i + 1]]) {
                if (config.type === 'boolean') {
                    value = true;
                } else {
                    errors.push(`Value required for ${flag} (${label})`);
                    continue;
                }
            } else {
                value = process.argv[++i];
            }
        }
        switch (config.type) {
            case 'string':
                args[key] = value;
                break;
            case 'number':
                args[key] = parseFloat(value);
                if (args[key] === NaN) {
                    errors.push(`Invalid number provided for ${label}: ${args[key]}`);
                }
                break;
            case 'boolean':
                if (typeof value === 'boolean') {
                    args[key] = value;
                } else if (value.toLowerCase() === 'true') {
                    args[key] = true;
                } else if (value.toLowerCase() === 'false') {
                    args[key] = false;
                } else {
                    errors.push(`Invalid boolean provided for ${label}: ${value}`);
                }
                break;
            case 'enum':
                args[key] = value;
                if (!config.enumValues.has(args[key])) {
                    const allowedValues = Array.from(config.enumValues).join(',');
                    errors.push(
                        `Invalid value provided for ${label}: "${args[key]}". Allowed values: [${allowedValues}]`
                    );
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
    return {
        args,
        errors
    };
}
