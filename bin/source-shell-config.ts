import fs from 'fs';

const QUOTE_DELIMS = ['"', "'"];

export default function sourceShellConfig(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    return Object.freeze(
        fs
            .readFileSync(filePath)
            .toString()
            .split('\n')
            .filter((line) => !!line)
            .reduce(
                (acc, line) => {
                    const parts = line.split('=');
                    if (parts.length < 2) {
                        return acc;
                    }
                    let value: string = parts.slice(1).join('=');
                    for (const delim of QUOTE_DELIMS) {
                        if (value.startsWith(delim) && value.endsWith(delim)) {
                            value = value.substring(1, value.length - 1);
                            break;
                        }
                    }
                    return Object.assign(acc, { [parts[0]]: value });
                },
                {} as Record<string, string>
            )
    );
}
