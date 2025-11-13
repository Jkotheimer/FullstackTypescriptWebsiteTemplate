import fs from 'fs';

const QUOTE_DELIMS = ['"', "'"];

export function sourceShellConfig(filePath: string): Record<string, string> {
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

export function writeShellConfig(filePath: string, data: Record<string, any>, preserve: boolean = true): void {
    const dataToWrite: Record<string, string> = {};
    if (fs.existsSync(filePath)) {
        Object.assign(dataToWrite, sourceShellConfig(filePath));
        console.log('existing data', dataToWrite);
    }
    Object.assign(dataToWrite, data);

    fs.writeFileSync(
        filePath,
        Object.keys(data)
            .reduce((lines, key) => {
                let value: any = data[key];
                if (value == null) {
                    return lines;
                }
                if (typeof value === 'object') {
                    value = JSON.stringify(value);
                } else if (typeof value.toString === 'function') {
                    value = value.toString();
                }
                if (typeof value === 'string') {
                    value = `"${value.replaceAll('"', '\\"')}"`;
                }
                lines.push(`${key}=${value}`);
                return lines;
            }, [] as Array<string>)
            .join('\n')
    );
}
