import { error } from 'console';
import readline from 'readline';

// These type declarations are not included in the standard typescript lib,
// but they do exist under the hood, and we override them in this script, so we override them here
interface ExtendedReadlineInterface extends readline.Interface {
    _writeToOutput: (str: string) => void;
    output: {
        write: (str: string) => void;
    };
}

export type CLIValueType = string & ('enum' | 'string' | 'number' | 'boolean');

export type CLIValue = string | number | boolean;

export interface CLIValueParseResult {
    value?: CLIValue;
    error?: string;
}

export interface ICLIValueConfig {
    key: string;
    label: string;
    type: CLIValueType;
    required?: boolean;
    defaultValue?: CLIValue;
    enumValues?: Set<String>;
    masked?: boolean;
    flags?: Set<string>;
}

export class CLIValueConfig implements ICLIValueConfig {
    public key: string;
    public label: string;
    public type: CLIValueType;
    public required?: boolean;
    public defaultValue?: CLIValue;
    public enumValues?: Set<String>;
    public masked?: boolean;
    public flags?: Set<string>;
    constructor(config: ICLIValueConfig) {
        this.key = config.key;
        this.label = config.label;
        this.type = config.type;
        this.required = config.required;
        this.defaultValue = config.defaultValue;
        this.enumValues = config.enumValues;
        this.masked = config.masked;
        this.flags = config.flags;
    }

    // Guaranteed non-null default
    get fallbackDefaultValue(): CLIValue {
        if (this.type === 'boolean') {
            return false;
        }
        if (this.type === 'number') {
            return 0;
        }
        return '';
    }

    parseValue(value: CLIValue | undefined, label: string = this.label): CLIValueParseResult {
        const result: CLIValueParseResult = {
            value: value ?? this.defaultValue ?? this.fallbackDefaultValue
        };
        if (this.required && value == null && this.defaultValue == null) {
            result.error = `Missing required value for ${label}.`;
            return result;
        }
        switch (this.type) {
            case 'number':
                result.value = parseFloat(value as string);
                if (Number.isNaN(result.value)) {
                    result.error = `Invalid number provided for ${this.label}: ${value}`;
                }
                break;
            case 'boolean':
                if (typeof result.value !== 'string') {
                    result.value = !!value;
                } else {
                    const lcv = result.value.toLowerCase();
                    const truthyValues = new Set<string>(['true', 'y', 'yes']);
                    const falsyValues = new Set<string>(['false', 'n', 'no']);
                    if (truthyValues.has(lcv)) {
                        result.value = true;
                    } else if (falsyValues.has(lcv)) {
                        result.value = false;
                    } else {
                        result.value = `Invalid boolean provided for ${label}: ${value}`;
                    }
                }
                break;
            case 'enum':
                if (typeof value !== 'string' || !this.enumValues?.has(value)) {
                    const allowedValues = Array.from(this.enumValues || []).join(',');
                    result.error = `Invalid value provided for ${label}: ${value}. Allowed values: [${allowedValues}]`;
                }
            // purposefully falling thru here
            case 'string':
                result.value = result.value?.toString() ?? '';
                break;
            default:
                result.error = `Invalid argument this type: ${this.type}`;
        }
        return result;
    }

    apply(obj: Record<string, any>, value: CLIValue) {
        const parseResult = this.parseValue(value);
        if (parseResult.error) {
            throw parseResult.error;
        }
        obj[this.key] = value;
    }
}

export type CLIValueConfigInput =
    | CLIValueConfig
    | ICLIValueConfig
    | Readonly<CLIValueConfig>
    | Readonly<ICLIValueConfig>;

/**
 * @description Provides utility methods for capturing data from the CLI
 */
export default class CLIReader {
    /**
     * @description Prompt the user for input variable value
     */
    static prompt(configInput: CLIValueConfigInput): Promise<CLIValue> {
        return new Promise((resolve, reject) => {
            const config = configInput instanceof CLIValueConfig ? configInput : new CLIValueConfig(configInput);
            let defaultPrompt = '';
            if (config.defaultValue != null) {
                let defaultValue = config.defaultValue;
                if (config.masked) {
                    defaultValue = defaultValue.toString().replace(/./g, '*');
                }
                defaultPrompt = ` (default=${defaultValue})`;
            }
            let acceptedValuesPrompt = '';
            if (config.type === 'enum' && !!config.enumValues) {
                acceptedValuesPrompt = ` [${Array.from(config.enumValues).join(', ')}]`;
            } else if (config.type === 'boolean') {
                if (config.defaultValue) {
                    acceptedValuesPrompt = ' [Y/n]';
                } else {
                    acceptedValuesPrompt = ' [y/N]';
                }
                defaultPrompt = '';
            }
            const rli = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            }) as ExtendedReadlineInterface;
            const prompt = `${config.label}${acceptedValuesPrompt}${defaultPrompt}: `;
            rli.question(prompt, (result) => {
                if (config.masked) {
                    rli.output.write('\n');
                }
                rli.close();
                const value = result || config.defaultValue;
                const validityResult = config.parseValue(value);
                if (validityResult.error || validityResult.value === undefined) {
                    if (validityResult.error) {
                        console.error(validityResult.error);
                    }
                    resolve(CLIReader.prompt(config));
                } else {
                    resolve(validityResult.value);
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

    static parseArgv(configs: Array<CLIValueConfigInput> | Readonly<Array<CLIValueConfigInput>>): object {
        if (!Array.isArray(configs)) {
            throw new Error('Configs input must be an array.');
        }
        const duplicateFlags: Record<string, Array<CLIValueConfig>> = {};
        const configByArgFlags: Record<string, CLIValueConfig> = configs.reduce(
            (configByArgFlags, configInput) => {
                const config = configInput instanceof CLIValueConfig ? configInput : new CLIValueConfig(configInput);
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
            {} as Record<string, CLIValueConfig>
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
        const args: Record<string, CLIValue> = {};
        for (let i = 2; i < process.argv.length; i++) {
            const splitArg: Array<string> = process.argv[i].split('=');
            const flag: string = splitArg[0];
            const config: CLIValueConfig = configByArgFlags[flag];
            if (!config) {
                errors.push(`Invalid argument: ${flag}`);
                continue;
            }
            const key: string = config.key;
            const label: string = `${config.label || config.key} [${flag}]`;
            let value: CLIValue = splitArg.slice(1, splitArg.length).join('');
            if (!value.length) {
                if (i >= process.argv.length || configByArgFlags[process.argv[i + 1]]) {
                    if (config.type === 'boolean') {
                        value = true;
                    } else {
                        let errorMessage = `No value was provided for ${label}. `;
                        if (config.type === 'enum') {
                            const enumValues = Array.from(config.enumValues || []).join(',');
                            errorMessage += `One of the following values must be provided: [${enumValues}]`;
                        } else if (config.type === 'string') {
                            errorMessage += 'A string must be provided.';
                        } else if (config.type === 'number') {
                            errorMessage += 'A number must be provided.';
                        }
                        errors.push(errorMessage);
                        continue;
                    }
                } else {
                    value = process.argv[++i] as CLIValue;
                }
            }
            const parseResult = config.parseValue(value);
            if (parseResult.error) {
                errors.push(parseResult.error);
            } else if (parseResult.value) {
                args[key] = parseResult.value;
            }
        }
        if (errors.length) {
            throw new Error(errors.join('\n'));
        }
        return args;
    }
}
